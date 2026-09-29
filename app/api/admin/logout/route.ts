import { NextRequest, NextResponse } from "next/server";
import { clearAdminGateCookie } from "@/lib/admin-session";
import { requireAdmin } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";

/**
 * POST /api/admin/logout — drops the signed page-gate cookie.
 *
 * Clearing a cookie grants nothing. When the caller still holds a valid
 * admin session, the sign-out is written to the audit log. The cookie is
 * cleared either way.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!("error" in auth)) {
    try {
      await writeAuditLog({
        actorUid: auth.admin.uid,
        action: "ADMIN_LOGOUT",
        targetId: "session",
      });
    } catch (error) {
      console.error("Logout audit write failed:", error);
    }
  }
  return clearAdminGateCookie(NextResponse.json({ ok: true }));
}
