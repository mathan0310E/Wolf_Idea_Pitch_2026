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
The Firebase web API key is `FIREBASE_WEB_API_KEY` and is used only by the
server. It must not be stored under a `NEXT_PUBLIC_` name, because that
prefix is copied into the browser bundle. `/api/health` does not return
project ids or keys.
The OTP endpoints use the identity-only gate so the challenge can be issued.
Mail credentials (`SMTP_USER`/`SMTP_PASS`) are server-only environment
variables, and the API never returns provider text — only a short classified
failure code (`smtp-auth`, `smtp-<code>`, `smtp-tls`, …).

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
- `lib/security-headers.ts` is the single policy. `proxy.ts` and
  `next.config.ts` both apply it, so the static-asset fallback cannot drift
  looser than the document policy. The policy blocks object embeds, framing,
  and cross-site form posts (`object-src 'none'`, `frame-ancestors 'none'`,
  `form-action 'self'`), locks unused browser features in `Permissions-Policy`,
  sets `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Resource-Policy: same-origin`, and disables
  `X-Powered-By`. `script-src` is `'self'`, `'unsafe-inline'`, and
  `https://apis.google.com` — not any `https:` origin.
