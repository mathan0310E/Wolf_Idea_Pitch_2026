import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { adminVerifySchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const actorUid = auth.admin.uid;

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

    const paymentStatus = status === "REJECTED" ? "REJECTED" : "VERIFIED";
    const registrationStatus = status === "REJECTED" ? "REJECTED" : "CONFIRMED";

    const updatePayload: Record<string, unknown> = {
      paymentStatus,
      registrationStatus,
      updatedAt: now,
    };

    if (status === "REJECTED" && rejectionReason) {
      updatePayload.rejectionReason = rejectionReason;
    }

    await regRef.update(updatePayload);

    // Update payments collection
    const paymentRef = adminDb.collection("payments").doc(`PAY-${registrationId}`);
    await paymentRef.set(
      {
        status: paymentStatus,
        rejectionReason: rejectionReason || null,
        verifiedBy: actorUid,
        verifiedAt: now,
      },
      { merge: true }
    );

    // Write Audit Log (§6)
    await adminDb.collection("auditLogs").add({
      actorUid,
      action: `PAYMENT_${status}`,
      targetId: registrationId,
      before: { paymentStatus: beforeState?.paymentStatus },
      after: updatePayload,
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
