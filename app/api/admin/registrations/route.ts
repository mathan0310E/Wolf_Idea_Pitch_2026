import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
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
    const type = (searchParams.get("type") || "ALL").toLowerCase();
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

    if (type !== "ALL") {
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
