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
2. `POST /api/admin/otp/send` generates a one-time code, stores only a
   uid-salted SHA-256 hash in `otp_tokens/{uid}` (5-minute TTL, max 3 attempts,
   60 s resend cooldown), and emails the plaintext code with `nodemailer` over
   SMTP (§3b). Delivery is synchronous, so the response itself carries the
   outcome (`sent`, `delivery: "SUCCESS"`) and it is recorded on the OTP
   document. Every send/verify/failure is audited as `OTP_SENT` /
   `OTP_VERIFIED` / `OTP_FAILED` / `OTP_SEND_FAILED`.
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

## 3b. Admin 2FA email delivery (SMTP with nodemailer — no Blaze plan required)

The OTP is sent synchronously by the Next.js server route with `nodemailer`
(`lib/mailer.ts`) over a plain SMTP submission connection. It does not use the
Gmail API, an OAuth client, the Firebase Trigger Email extension, or a Blaze
billing plan. Firebase Auth and Firestore stay on the free Spark resources; the
sending mailbox's own sending quota applies.

One-time setup (Gmail as the sender):

1. Enable **2-Step Verification** on the sending Google account, then create an
   **App Password** (Google Account → Security → App passwords). The
   16-character App Password goes into `SMTP_PASS` — never the account password.
2. Put the mailbox and the App Password in `.env.local` and the same
   server-only variables in Vercel:

   ```bash
   SMTP_USER="your-sender@gmail.com"
   SMTP_PASS="your-16-character-app-password"
   ```

   `SMTP_HOST`/`SMTP_PORT` already default to `smtp.gmail.com:465` with implicit
   TLS, so those two variables are all Gmail needs. `SMTP_FROM` (defaults to
   `SMTP_USER`) and `SMTP_FROM_NAME` are optional. Never expose these values
   through `NEXT_PUBLIC_*` variables.
3. Any other provider works by also setting `SMTP_HOST`, `SMTP_PORT`, and
   `SMTP_SECURE` (`true` for implicit TLS such as port 465, `false` to upgrade
   with STARTTLS such as port 587). TLS 1.2 is the enforced minimum.
4. Send a test OTP. A successful send answers `sent: true` with
   `delivery: "SUCCESS"`. A failed send deletes the undelivered OTP and records
   `OTP_SEND_FAILED`; SMTP failures are classified into a short code
   (`smtp-auth`, `smtp-<code>`, `smtp-tls`, …) so no provider banner or
   credential ever reaches the client. Because the send is synchronous there is
   nothing to poll — the old delivery-status endpoint is gone.

The server stores only delivery metadata (`provider: "smtp"`, `state`,
`messageId`, `attempts`) alongside the hashed OTP. The plaintext code and the
SMTP credentials are not stored in Firestore. `firestore.rules` keeps
`otp_tokens` and `otp_verified` server-only:

```bash
npx firebase-tools deploy --only firestore:rules
```

Without `SMTP_USER`/`SMTP_PASS`, local development returns a `devNotice` and
does not log or print the OTP. Production returns 503 until SMTP is configured.

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

