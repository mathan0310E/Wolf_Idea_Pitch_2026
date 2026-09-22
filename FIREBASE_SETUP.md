# Firebase Setup Guide — WOLF IDEA PITCH 2026

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
   The project ID must match `.firebaserc` and `.env.local` — for this repo it is
   `wolf-idea-pitch` (if you create a different one, update `.firebaserc` too).
2. Register a Web App to get `apiKey`, `authDomain`, `projectId`, `storageBucket`, etc.
3. Copy `.env.example` to `.env.local` and fill in the values (never commit `.env.local`).
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL (used for SEO metadata).

## 2. Enable Firebase Services
- **Authentication**: Enable **Google** as the sign-in method (the admin panel
  uses Google sign-in with an email allowlist — see §3). Email/Password can
  stay enabled or be disabled; the login form no longer uses it.
- **Authentication → Settings → Authorized domains**: `localhost` is there by
  default for local testing. **Add your production domain** (e.g. the Vercel
  URL or custom domain) before go-live, or Google sign-in fails there with
  `auth/unauthorized-domain`.
- **Firestore Database**: Create database in production mode.
- **Storage**: Enable the default bucket (payment screenshots land here).

Deploy both security rules (config lives in `firebase.json` / `.firebaserc`):

```bash
npx firebase-tools login            # one-time, opens a browser
npx firebase-tools deploy --only firestore:rules,storage
```

No global install needed — `npx` fetches firebase-tools on first run. If the
deploy fails with a permission error, log in with an account that has
Owner/Editor access on the project.

## 3. Restrict Admin Access to YOUR Google Account (REQUIRED)

The admin panel signs in with **Google** (`/admin/login` → "Sign in with
Google"). Authorization is enforced **server-side on every admin API call**
(`lib/admin-auth.ts → requireAdmin`), by one of two gates:

1. **`ADMIN_EMAILS` allowlist (recommended — this is what you asked for).**
   Put your Google account email in `.env.local`:
   ```bash
   ADMIN_EMAILS="your-google-account@gmail.com"
   ```
   When set, ONLY that email can administer the event — any other Google
   account that signs in is rejected with 403 and a clear message. No claim
   setup needed. Add the same variable in Vercel for production.

2. **`role: "admin"` custom claim (fallback when `ADMIN_EMAILS` is empty).**
   Run the bundled setter (uses the service account already in `.env.local`):
   ```bash
   node scripts/set-admin-claim.mjs <uid-or-email>   # e.g. your Google email
   node scripts/set-admin-claim.mjs --check          # verify credentials offline
   ```

Local dev without Firebase credentials: the amber **Dev Sign-In (Mock
Admin)** button on `/admin/login` skips auth entirely (mock mode). It is
stripped from production builds.

## 4. Registration Gate (no redeploy needed)
- `GET /api/admin/settings` (public) returns `{ open, announcement }` — the
  register page auto-closes when `open` is false.
- `PUT /api/admin/settings` (admin token required) persists the gate in
  Firestore `settings/event`. The admin Settings page calls this; audit-logged
  as `REGISTRATION_OPENED` / `REGISTRATION_CLOSED`.

## 5. Screenshot Uploads
- Primary path: `POST /api/uploads/screenshot` validates type (JPG/PNG/WEBP)
  and size (≤ 5MB) server-side, stores in `payment-screenshots/` via Admin SDK,
  and returns a read URL the client attaches to the registration payload.
- Without Admin SDK credentials (local dev only), the route echoes the data
  URL back so the flow works end-to-end. In production without credentials it
  returns 503 — uploads must go through Storage — and oversized inline data
  URLs are rejected with 413.

