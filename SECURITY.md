# Security Architecture & Best Practices — WOLF IDEA PITCH 2026

## 1. Zero-Trust Server Boundary
- **Client Amounts & Member Counts**: Client-submitted total amounts or registration IDs are **never trusted**. Server recalculates fee (`memberCount × ₹300`) and enforces strict member array length validation.
- **Sequential Registration IDs**: IDs (`WOLF-2026-00001`) are generated atomically on the server.
- **Lookup Tokens**: Status lookup requires both the Registration ID and a 64-character secret `lookupToken` generated on submission. Sequential IDs do not double as lookup keys.

## 2. CSV Formula Injection Guard
All exported fields in CSV files are sanitized using `sanitizeForCsv()` to prevent formula execution (`=`, `+`, `-`, `@` character prefix escaping).

## 3. Custom Claim Admin Authorization
Admin endpoints verify Firebase Auth ID Tokens and custom claims (`role == 'admin'`). Every state modification creates an immutable log entry in `auditLogs`.

## 4. HTTP & Transport Security
- HTTPS enforced by Vercel.
- Security headers configured in `middleware.ts`: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
