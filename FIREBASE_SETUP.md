# Firebase Setup Guide — WOLF IDEA PITCH 2026

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
   The project ID must match `.firebaserc` and `.env.local` — for this repo it is
   `wolf-idea-pitch` (if you create a different one, update `.firebaserc` too).
2. Register a Web App to get `apiKey`, `authDomain`, `projectId`, etc. (no Storage bucket is needed — payment screenshots are stored as Base64 in Firestore).
3. Copy `.env.example` to `.env.local` and fill in the values (never commit `.env.local`).
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL (used for SEO metadata).

## 2. Enable Firebase Services
- **Authentication**: Enable **Email/Password** (the admin panel signs in with
  email + password, then completes an emailed 6-digit OTP second factor — see
  §3). Google provider is not used; Email/Password must stay enabled. The
  admin account's email must be **verified** (`email_verified` is enforced
  server-side on every admin call).
- **Authentication → Settings → Authorized domains**: `localhost` is there by
  default for local testing. **Add your production domain** (e.g. the Vercel
  URL or custom domain) before go-live, or sign-in fails there with
  `auth/unauthorized-domain`.
- **Firestore Database**: Create database in production mode.
- **Storage**: not used. Payment screenshots are stored as Base64 in Firestore, so no default bucket or Storage rules are required.

Deploy the Firestore security rules (config lives in `firebase.json` / `.firebaserc`):

```bash
npx firebase-tools login            # one-time, opens a browser
npx firebase-tools deploy --only firestore:rules
```

No global install needed — `npx` fetches firebase-tools on first run. If the
deploy fails with a permission error, log in with an account that has
Owner/Editor access on the project.

## 3. Restrict Admin Access to YOUR Account (REQUIRED)

The admin panel signs in at `/admin/login` with **email + password, then a
6-digit email OTP second factor** (`app/admin/login/page.tsx`):

1. Email + password are verified against Firebase Auth (the account's email
   must already be verified — `email_verified` is enforced server-side).
2. `POST /api/admin/otp/send` emails a one-time code (5-minute TTL, single
   use, max 3 attempts, 60 s resend cooldown; sha256-hashed in Firestore
   `otp_tokens/{uid}`, every send/verify/failure audited as `OTP_SENT` /
   `OTP_VERIFIED` / `OTP_FAILED`).
3. `POST /api/admin/otp/verify` checks the code and records
   `otp_verified/{uid}`. **Every** other `/api/admin/*` route
   (`lib/admin-auth.ts → requireAdmin`) requires a fresh OTP check (12 h
   TTL) — an ID token alone cannot administer the event.

Authorization is enforced **server-side on every admin API call**
(`lib/admin-auth.ts → requireAdmin` / `requireAdminIdentity`), by one of two
gates:

1. **`ADMIN_EMAILS` allowlist (recommended — this is what you asked for).**
   Put your admin account email in `.env.local`:
   ```bash
   ADMIN_EMAILS="your-admin-email@gmail.com"
   ```
   When set, ONLY that email can administer the event — any other account
   that signs in is rejected with 403 and a clear message. No claim
   setup needed. Add the same variable in Vercel for production.

2. **`role: "admin"` custom claim (fallback when `ADMIN_EMAILS` is empty).**
   Run the bundled setter (uses the service account already in `.env.local`):
   ```bash
   node scripts/set-admin-claim.mjs <uid-or-email>   # e.g. your Google email
   node scripts/set-admin-claim.mjs --check          # verify credentials offline
   ```

There is **no dev login and no admin bypass in any environment**. When Admin
SDK credentials are absent, `requireAdmin()` fails closed (503 for admin APIs,
401 for missing tokens) — a Bearer token is never trusted without verification.
Administer the event with a real Firebase project plus the `ADMIN_EMAILS`
allowlist above.

## 3b. Admin 2FA email delivery (Firebase Trigger Email extension — REQUIRED in production)

The OTP code is delivered by Firebase, not by this repo: the server
(`lib/mailer.ts`) queues each code as a Firestore document in the `mail`
collection, and the official **Trigger Email** extension delivers it using the
provider you configure in the Firebase console. No SMTP secrets live in
`.env.local`, Vercel env vars, or this repo.

One-time setup (Firebase console → **Build → Extensions → Trigger Email → Install**):

1. Collection: `mail` (the default — matches `lib/mailer.ts`).
2. Add the extension's service account as a Firestore writer, or leave the
   default; the server writes via the Admin SDK which bypasses rules.
3. Configure the sender (SMTP relay URI or SendGrid key) in the extension
   config — this is the ONLY place mail credentials live.
4. Deploy the updated rules (`firestore.rules` denies all client access to
   `mail`, `otp_tokens`, `otp_verified` — server/Admin SDK only):
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```

Rules:

- **Without the extension installed, admin sign-in fails closed**: OTP send
  returns 503 (`Email delivery is not configured`) — 2FA can never be
  silently skipped.
- **Local dev without Admin SDK credentials is still testable**: the code is
  printed to the server console (`[mailer] DEV MODE — admin OTP for …`) with
  a `devNotice` in the API response — the full password → OTP → dashboard
  flow works without credentials. (The local mock store is not watched by the
  extension, so no email is sent locally — by design.)

## 4. Registration Gate (no redeploy needed)
- `GET /api/admin/settings` (public) returns `{ open, announcement }` — the
  register page auto-closes when `open` is false.
- `PUT /api/admin/settings` (admin token required) persists the gate in
  Firestore `settings/event`. The admin Settings page calls this; audit-logged
  as `REGISTRATION_OPENED` / `REGISTRATION_CLOSED`.

## 5. Payment Screenshots (Base64 — no Firebase Storage)
- Screenshots travel as Base64 inside `POST /api/registrations/submit` (validated
  JPG/PNG/WEBP, ≤ 500 KB), Base64-decoded server-side and stored in the
  `payments` Firestore document — they never touch Firebase Storage.
- `POST /api/uploads/screenshot` is **disabled (410 Gone)** to fail old clients
  loudly instead of silently dropping a proof of payment.
- Firestore documents cap at 1 MiB, which is why the image is capped at 500 KB
  (the Base64 payload plus the rest of the payment doc must stay under the limit).
- No Storage bucket and no Storage rules are required.

