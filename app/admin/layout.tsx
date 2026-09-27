import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_GATE_COOKIE, ADMIN_GATE_PATHS, isValidAdminGate } from "@/lib/admin-session";

/**
 * Admin shell. Public and admin pages never share a layout: the public site
 * renders Navbar/Footer per page, while every /admin/* route is wrapped by
 * this minimal, unindexed shell and gated on the server.
 */
export const metadata: Metadata = {
  title: "CYBER WOLF ADMIN — WOLF IDEA PITCH 2026",
  description: "Restricted organizer area.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, nocache: true },
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const onLogin =
    pathname === ADMIN_GATE_PATHS.login || pathname.startsWith(`${ADMIN_GATE_PATHS.login}/`);

  if (!onLogin && !isValidAdminGate(cookieStore.get(ADMIN_GATE_COOKIE)?.value)) {
    redirect(ADMIN_GATE_PATHS.login);
  }

  return <div className="min-h-screen bg-[#080808]">{children}</div>;
}
