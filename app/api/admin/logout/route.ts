import { NextResponse } from "next/server";
import { clearAdminGateCookie } from "@/lib/admin-session";

/**
 * POST /api/admin/logout — drops the signed page-gate cookie.
 *
 * Deliberately unauthenticated: clearing a cookie grants nothing, and the
 * Firebase client session in sessionStorage is destroyed by the caller. Every
 * /api/admin/* data route stays protected by requireAdmin() regardless.
 */
export async function POST() {
  return clearAdminGateCookie(NextResponse.json({ ok: true }));
}
