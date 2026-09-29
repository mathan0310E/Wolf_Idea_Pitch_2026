import { NextResponse, type NextRequest } from "next/server";
import { securityHeaders } from "@/lib/security-headers";
import { adminBasePath } from "@/lib/admin-path";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The old organizer path must not answer or reveal the hashed path.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  // Forwarded so server layouts (app/admin/layout.tsx) can tell the login page
  // apart from the gated admin pages without a second request.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const header of securityHeaders()) {
    response.headers.set(header.key, header.value);
  }

  // The admin area is never indexable and never cached, even for a crawler
  // that ignores robots.txt (public/robots.txt also disallows /admin/).
  if (pathname.startsWith(`${adminBasePath()}/`) || pathname === adminBasePath()) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
