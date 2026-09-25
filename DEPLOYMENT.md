# DEPLOYMENT — WOLF IDEA PITCH 2026 (Go-Live Checklist)

The app **fails safe in production**: with no Firebase credentials it refuses to
write data (503) and rejects all admin tokens — it will never silently fake
success. Follow this list to make it fully live.

## 1. Firebase Console (one time)

1. Project ID: `wolf-idea-pitch` (matches `.firebaserc` and `.env.local` —
   if you ever rename the project, update both).
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
   Admin sign-in is email + password followed by an emailed 6-digit OTP; no
   Google provider is needed. The admin account's email must be verified.
3. Add the organizer's **admin account email** to the allowlist — this is the
   primary admin gate, enforced server-side on **every** `/api/admin/*` call
   (`lib/admin-auth.ts`):

   ```bash
   # .env.local (dev) — and the same key in Vercel env vars (step 2 below)
   ADMIN_EMAILS="organizer@cyberwolf.in"
   ```

   Only these comma-separated emails can administer the event; any other
   account gets 403 and its Firebase session is dropped immediately.
   After password sign-in the admin must also enter the emailed OTP — an ID
   token alone is rejected with 403 (`two-factor verification required`)
   until `POST /api/admin/otp/verify` succeeds.
4. *(Fallback — only when `ADMIN_EMAILS` is empty)* grant the `role: "admin"`
   custom claim with the bundled script (replaces `firebase functions:shell`,
   which requires a `functions/` directory this project doesn't have):

   ```bash
   node scripts/set-admin-claim.mjs <uid-or-email>   # e.g. organizer@cyberwolf.in
   node scripts/set-admin-claim.mjs --check          # verify credentials, no network
   ```

   Claims need a token refresh — sign out and sign in again at `/admin/login`.
5. **Firestore Database** → create in production mode. Deploy the rules
   (config now lives in `firebase.json` + `.firebaserc`; rules files are
   `firestore.rules` at the repo root (no Storage bucket or `storage.rules` is used):

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```
6. **Screenshots** → stored as Base64 inside `POST /api/registrations/submit`, decoded and saved in the Firestore `payments` document. No Firebase Storage bucket is needed.
7. **Build → Extensions → Trigger Email → Install** (delivers the admin 2FA
   OTP codes — REQUIRED, else OTP send is 503): collection `mail`, sender
   configured in the extension itself. No mail secrets go in Vercel env vars.
   Redeploy rules afterwards (`npx firebase-tools deploy --only
   firestore:rules`) so `mail` / `otp_tokens` / `otp_verified` stay
   server-only.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | client auth (login, registration) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | client |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | client |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | client |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | client |
| `NEXT_PUBLIC_SITE_URL` | SEO metadata / sitemap — set to the **final domain** |
| `ADMIN_EMAILS` | server admin gate — comma-separated admin emails allowed to sign in to `/admin` (primary gate) |
| `FIREBASE_ADMIN_PROJECT_ID` | server (Admin SDK) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | server (service account email) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | server — keep the literal `\n` escapes |
| *(no mail vars)* | OTP email is sent by the Firebase Trigger Email extension (step 1.7) — nothing to configure in Vercel |
Copy `.env.example` for the exact shape. Never commit real values.

## 3. Pre-deploy verification (local, with real env in `.env.local`)

```bash
npm run lint          # 0 errors
npx tsc --noEmit      # 0 errors
npm run build         # exit 0
npm run start         # then:
curl http://localhost:3000/api/health   # → { "database": "firebase" }
```

If `/api/health` says `"mock"`, the server-side env vars are missing — fix
before going live. The server logs `[FATAL CONFIG]` at startup in that state.

## 4. After deploy

- [x] `https://<domain>/api/health` → `database: "firebase"`
- [x] Register a test team end-to-end; check Firestore gets the doc with a
      `WOLF-2026-XXXXX` id and the payment screenshot is stored. **Screenshots
      no longer go to Firebase Storage** — `POST /api/uploads/screenshot` now
      returns `410 Gone`. The image (JPG/PNG/WEBP, **≤500 KB**) travels as
      Base64 inside the submit payload and lands in a dedicated Firestore
      `payments/PAY-WOLF-2026-XXXXX` document, which keeps `registrations`
      list queries cheap and stays under Firestore's 1 MiB document limit.
- [x] Sign in at `/admin/login` with email + password using an allowlisted
      email (`ADMIN_EMAILS`), then enter the emailed 6-digit code. Skipping the
      OTP step leaves `/api/admin/session` at 403
      (`two-factor verification required`), and `OTP_SENT` / `OTP_VERIFIED`
      entries render at `/admin/audit-logs`.
      *Still to confirm by hand:* a non-allowlisted account must get 403 and be
      signed out immediately (needs a second verified non-admin account).
- [x] Verify/reject the test registration from `/admin/registrations`.
- [ ] Add your custom domain in Vercel and update `NEXT_PUBLIC_SITE_URL`
      (drives canonical URLs, OpenGraph, sitemap).
- [x] Confirm security headers: `X-Frame-Options: DENY`, CSP without
      `unsafe-eval` in production, HSTS on.

Post-deploy items verified on **2026-09-23** against a local production server
(`npm run build` + `next start`) backed by the live Firebase project, using
`scripts/live-e2e.mjs` — the repeatable end-to-end check
(`node --env-file=.env.local scripts/live-e2e.mjs [baseUrl]`): registration →
screenshot → status lookup → admin 2FA OTP → registrations feed → screenshot
retrieval → rejection → audit trail. It writes ONE test registration and
rejects it, so re-running it is safe before a launch.

## 5. Known limits / operational notes

- **Rate limiting is in-memory** (`lib/rate-limit.ts`): per serverless
  instance. Good-enough abuse protection; for strict global limits add
  Upstash Redis later.
- **No dev login / admin bypass** exists in any build. `/admin/login` uses
  email + password plus an emailed OTP second factor; `requireAdmin()`
  verifies a real Firebase ID token, enforces the `ADMIN_EMAILS` allowlist
  AND a fresh OTP check, failing closed (503/401/403) when Admin SDK
  credentials are absent.
- **CSP keeps `'unsafe-inline'`** for scripts: required by Next.js hydration
  without a nonce-based middleware; everything else is locked down.
- Firestore rules (not the app) are the hard boundary for client access;
  server routes always use the Admin SDK.
