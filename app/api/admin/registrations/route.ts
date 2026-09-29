import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { writeAuditLog } from "@/lib/admin-audit";
import { archiveDocument } from "@/lib/backup";
import type { Registration } from "@/lib/types";

/**
 * GET /api/admin/registrations?search=&status=&type=&page=&limit=
 * Admin-only master table feed with server-side search/filter/pagination.
 * Lookup tokens are stripped — they are per-team secrets, never admin-listed.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const status = (searchParams.get("status") || "ALL").toUpperCase();
    // NOTE: `type` is normalised to lowercase, so its "no filter" sentinel must
    // be lowercase too. Comparing the lowercased value against "ALL" made
    // `type !== "ALL"` true on EVERY request, so a `teamType === "all"` filter
    // always ran and silently dropped every row: the admin dashboard, payments
    // and registrations views all rendered an empty list.
    const type = (searchParams.get("type") || "all").toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );

    const snapshot = await adminDb
      .collection("registrations")
      .orderBy("createdAt", "desc")
      .get();

    let regs: Registration[] = snapshot.docs.map((doc) =>
      doc.data()
    ) as Registration[];

    // Newest first (defensive — mock store ignores orderBy)
    regs.sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    if (status !== "ALL") {
      regs = regs.filter(
        (r) =>
          r.paymentStatus === status || r.registrationStatus === status
      );
    }

    if (type !== "all") {
      regs = regs.filter((r) => r.teamType === type);
    }

    if (search) {
      regs = regs.filter((r) => {
        const haystack = [
          r.registrationId,
          r.teamName,
          r.domain,
          r.transactionId,
          r.utr,
          ...(r.members || []).flatMap((m) => [
            m.name,
            m.email,
            m.phone,
            m.college,
            m.registerNumber,
          ]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    const total = regs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const pageItems = regs.slice((safePage - 1) * limit, safePage * limit);

    // Strip per-team secret before sending to admin list view
    const registrations = pageItems.map(
      ({ lookupToken: _lookupToken, ...rest }) => { void _lookupToken; return rest; }
    );

    return NextResponse.json({
      success: true,
      registrations,
      total,
      page: safePage,
      totalPages,
    });
  } catch (error) {
    console.error("Admin Registrations Feed Error:", error);
    return NextResponse.json(
      { error: "Failed to load registrations." },
      { status: 500 }
    );
  }
}

const REGISTRATION_ID = /^WOLF-\d{4}-\d{5}$/;

/**
 * DELETE /api/admin/registrations
 * Body: { registrationId, reason }
 * Copies the registration and its payment (including the screenshot archive)
 * into server-only backup collections, then deletes the live documents.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  let body: { registrationId?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const registrationId =
    typeof body.registrationId === "string" ? body.registrationId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!REGISTRATION_ID.test(registrationId)) {
    return NextResponse.json({ error: "Unknown registration." }, { status: 400 });
  }
  if (reason.length < 3 || reason.length > 300) {
    return NextResponse.json(
      { error: "A removal reason of 3–300 characters is required." },
      { status: 400 }
    );
  }

  try {
    const regRef = adminDb.collection("registrations").doc(registrationId);
    const regSnap = await regRef.get();
    if (!regSnap.exists) {
      return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }
    const registration = (regSnap.data() || {}) as Record<string, unknown>;

    const paymentId = `PAY-${registrationId}`;
    const paymentRef = adminDb.collection("payments").doc(paymentId);
    const paymentSnap = await paymentRef.get();
    const payment = paymentSnap.exists
      ? ((paymentSnap.data() || {}) as Record<string, unknown>)
      : null;

    const registrationBackupId = await archiveDocument({
      sourceCollection: "registrations",
      sourceId: registrationId,
      data: registration,
      actorUid: auth.admin.uid,
      reason,
    });

    let paymentBackupId: string | null = null;
    try {
      if (payment) {
        paymentBackupId = await archiveDocument({
          sourceCollection: "payments",
          sourceId: paymentId,
          data: payment,
          actorUid: auth.admin.uid,
          reason,
        });
      }
    } catch (backupError) {
      await adminDb.collection("backups").doc(registrationBackupId).delete().catch(() => undefined);
      throw backupError;
    }

    if (payment) await paymentRef.delete();
    await regRef.delete();

    await writeAuditLog({
      actorUid: auth.admin.uid,
      action: "REGISTRATION_REMOVED",
      targetId: registrationId,
      after: {
        reason,
        registrationBackupId,
        paymentBackupId,
      },
    });

    return NextResponse.json({
      success: true,
      registrationBackupId,
      paymentBackupId,
    });
  } catch (error) {
    console.error("Admin registration remove failed:", error);
    return NextResponse.json(
      { error: "Failed to back up and remove the registration." },
      { status: 500 }
    );
  }
}
