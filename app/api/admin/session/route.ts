import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Lightweight session probe used by the admin login page: the client sends
 * its Firebase ID token as a Bearer header and this route runs the exact
 * same requireAdmin() gate as every other /api/admin/* route. 200 => the
 * account may administer the event; anything else => not authorized.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  return NextResponse.json({ ok: true, admin: auth.admin });
}