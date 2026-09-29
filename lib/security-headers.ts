export type SecurityHeader = { key: string; value: string };

export function isDevRuntime(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Document policy for every response. `proxy.ts` applies it to app routes.
 * `next.config.ts` applies the same list to paths the proxy matcher skips
 * (`_next/static`, `_next/image`, favicon), so the fallback cannot drift looser.
 */
export function contentSecurityPolicy(dev = isDevRuntime()): string {
  return [
    "default-src 'self'",
    // 'unsafe-inline' is required by Next.js hydration without a nonce.
    // 'unsafe-eval' is only the dev HMR runtime.
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self'",
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "interest-cohort=()",
].join(", ");

export function securityHeaders(dev = isDevRuntime()): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    { key: "Content-Security-Policy", value: contentSecurityPolicy(dev) },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];

  if (!dev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
