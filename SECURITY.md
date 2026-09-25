# Security Architecture & Best Practices — WOLF IDEA PITCH 2026

## 1. Zero-Trust Server Boundary
- **Client Amounts & Member Counts**: Client-submitted total amounts or registration IDs are **never trusted**. Server recalculates fee (`memberCount × ₹300`) and enforces strict member array length validation.
- **Sequential Registration IDs**: IDs (`WOLF-2026-00001`) are generated atomically on the server.
- **Lookup Tokens**: Status lookup requires both the Registration ID and a 64-character secret `lookupToken` generated on submission. Sequential IDs do not double as lookup keys.

## 2. CSV Formula Injection Guard
All exported fields in CSV files are sanitized using `sanitizeForCsv()` to prevent formula execution (`=`, `+`, `-`, `@` character prefix escaping).

## 3. Admin Authorization (allowlist + email verification + 2FA)
Admin API routes verify Firebase Auth ID tokens server-side (`requireAdmin()` in
`lib/admin-auth.ts`) and require ALL of: verified email (`email_verified` claim),
membership in the `ADMIN_EMAILS` allowlist (strict gate when configured, falling
back to the `role: "admin"` custom claim otherwise), and a fresh email-OTP 2FA
check (`otp_verified/{uid}`, 12 h TTL, issued by `POST /api/admin/otp/verify`).
Every state modification creates an immutable log entry in `auditLogs`.
The OTP endpoints use the identity-only gate so the challenge can be issued.

## 4. HTTP & Transport Security
- HTTPS enforced by Vercel.
- Security headers are set in `proxy.ts` (Next.js 16 renamed `middleware.ts` to
  `proxy.ts`) and were verified against a real production server on 2026-09-23
  (`next build` + `next start`, response inspected with `curl -D -`):
  `Content-Security-Policy` (no `'unsafe-eval'` in production),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  (production only). The CSP keeps `'unsafe-inline'` for scripts because Next.js
  hydration needs it without a nonce, and admits the venue map through
  `frame-src https://www.google.com https://maps.google.com`.
- `next.config.ts` holds a second, fallback copy of these headers for paths
  outside the proxy matcher (static assets). Where both set the same header,
  the **proxy value is the one served** — verified: the live response carries a
  single `Content-Security-Policy` containing the proxy's directives.
