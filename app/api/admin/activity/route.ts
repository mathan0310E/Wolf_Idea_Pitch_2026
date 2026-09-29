import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { writeAuditLog } from "@/lib/admin-audit";
import { checkRateLimit } from "@/lib/rate-limit";

const PAGE_ACTIONS: Record<string, string> = {
  dashboard: "ADMIN_PAGE_DASHBOARD",
  registrations: "ADMIN_PAGE_REGISTRATIONS",
  payments: "ADMIN_PAGE_PAYMENTS",
  settings: "ADMIN_PAGE_SETTINGS",
  "audit-logs": "ADMIN_PAGE_AUDIT_LOGS",
};

/**
 * POST /api/admin/activity { page }
 * Records which admin screen was opened. The page name must be one of
 * the known admin screens; the hashed URL is not stored.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  let body: { page?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = typeof body.page === "string" ? body.page : "";
  const segment = raw.split("/").filter(Boolean).pop() || "";
  const action = PAGE_ACTIONS[segment];
  if (!action) {
    return NextResponse.json({ error: "Unknown admin page." }, { status: 400 });
  }

  if (!checkRateLimit(`admin-page:${auth.admin.uid}:${action}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ success: true, skipped: true });
  }

  try {
    await writeAuditLog({
      actorUid: auth.admin.uid,
      action,
      targetId: segment,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin page audit write failed:", error);
    return NextResponse.json({ error: "Failed to record admin activity." }, { status: 500 });
  }
}
