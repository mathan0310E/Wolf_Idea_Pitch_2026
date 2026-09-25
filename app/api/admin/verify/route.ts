import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { adminVerifySchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const actorUid = auth.admin.uid;
  const actorEmail = auth.admin.email ?? "";

  try {
    const raw = await req.json();
    const parsed = adminVerifySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid verification parameters" },
        { status: 400 }
      );
    }

    const { registrationId, status, rejectionReason } = parsed.data;

    if (status === "REJECTED" && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "A rejection reason is required to reject a submission." },
        { status: 400 }
      );
    }

    const regRef = adminDb.collection("registrations").doc(registrationId);
    const doc = await regRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const beforeState = doc.data();
    const now = new Date().toISOString();
    const paymentId = `PAY-${registrationId}`;

    const paymentStatus = status === "REJECTED" ? "REJECTED" : "VERIFIED";
    const registrationStatus = status === "REJECTED" ? "REJECTED" : "CONFIRMED";
    // Canonical audit action per the payment lifecycle contract.
    const auditAction = status === "REJECTED" ? "PAYMENT_REJECTED" : "PAYMENT_VERIFIED";

    const updatePayload: Record<string, unknown> = {
      paymentStatus,
      registrationStatus,
      updatedAt: now,
    };

    if (status === "REJECTED" && rejectionReason) {
      updatePayload.rejectionReason = rejectionReason;
    }

    await regRef.update(updatePayload);

    // Update the dedicated payment document (screenshot Base64 untouched).
    const paymentRef = adminDb.collection("payments").doc(paymentId);
    await paymentRef.set(
      {
        status: paymentStatus,
        rejectionReason: rejectionReason || null,
        verifiedBy: actorUid,
        verifiedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // Write Audit Log — metadata only, NEVER the Base64 image.
    await adminDb.collection("auditLogs").add({
      actorUid,
      actorEmail,
      action: auditAction,
      targetId: registrationId,
      registrationId,
      paymentId,
      before: { paymentStatus: beforeState?.paymentStatus },
      after: updatePayload,
      metadata: {
        amount: beforeState?.totalAmount ?? null,
        verifiedBy: actorUid,
        rejectionReason: status === "REJECTED" ? rejectionReason?.trim() ?? "" : undefined,
      },
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      message: `Registration ${registrationId} marked as ${status}`,
    });
  } catch (error: unknown) {
    console.error("Admin Verify Error:", error);
    return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 });
  }
}

/**
 * GET /api/admin/verify?screenshot=1&registrationId=WOLF-2026-00001
 * Admin-only, on-demand screenshot retrieval. The Base64 image is NEVER
 * included in list feeds — fetched only when an admin clicks
 * "View Payment Screenshot". Every view is audit-logged
 * (PAYMENT_SCREENSHOT_VIEWED) with metadata only, never the image.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  // Only serve the screenshot when explicitly requested (?screenshot=1).
  // Plain GET /api/admin/verify is not a defined endpoint.
  if (searchParams.get("screenshot") !== "1") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const registrationId = (searchParams.get("registrationId") || "").trim().toUpperCase();
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required." }, { status: 400 });
    }

    const paymentId = `PAY-${registrationId}`;
    const snap = await adminDb.collection("payments").doc(paymentId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }
    const data = snap.data() as {
      screenshotBase64?: unknown;
      screenshotMimeType?: unknown;
      screenshotSize?: unknown;
    } | undefined;

    if (typeof data?.screenshotBase64 !== "string" || data.screenshotBase64.length < 100) {
      // Legacy record stored a Storage URL instead of Base64.
      const legacy = (snap.data() as { screenshotUrl?: unknown } | undefined)?.screenshotUrl;
      if (typeof legacy === "string" && legacy.length > 0 && !legacy.startsWith("data:")) {
        return NextResponse.json({
          success: true,
          legacyUrl: legacy,
          mimeType: data?.screenshotMimeType ?? "image/png",
          size: data?.screenshotSize ?? 0,
        });
      }
      return NextResponse.json({ error: "No screenshot stored for this payment." }, { status: 404 });
    }

    const mime = typeof data.screenshotMimeType === "string" ? data.screenshotMimeType : "image/png";
    const size = typeof data.screenshotSize === "number" ? data.screenshotSize : 0;
    const now = new Date().toISOString();

    await adminDb.collection("auditLogs").add({
      actorUid: auth.admin.uid,
      actorEmail: auth.admin.email ?? "",
      action: "PAYMENT_SCREENSHOT_VIEWED",
      targetId: paymentId,
      registrationId,
      paymentId,
      metadata: { mimeType: mime, sizeBytes: size },
      timestamp: now,
    });

    // Rendered client-side as <img src={dataUrl}>; the raw Base64 string is
    // never placed into the DOM as text.
    return NextResponse.json({
      success: true,
      dataUrl: `data:${mime};base64,${data.screenshotBase64}`,
      mimeType: mime,
      size,
    });
  } catch (error) {
    console.error("Admin Screenshot View Error:", error);
    return NextResponse.json({ error: "Failed to load screenshot." }, { status: 500 });
  }
}

