# DEPLOYMENT — WOLF IDEA PITCH 2026 (Go-Live Checklist)

The app **fails safe in production**: with no Firebase credentials it refuses to
write data (503) and rejects all admin tokens — it will never silently fake
success. Follow this list to make it fully live.

## 1. Firebase Console (one time)

1. Project ID: `wolf-idea-pitch` (matches `.firebaserc` and `.env.local` —
   if you ever rename the project, update both).
2. **Build → Authentication → Sign-in method** → enable **Google**.
   Admin sign-in is Google-only; no password users are needed.
3. Add the organizer's **Google account** to the allowlist — this is the
   primary admin gate, enforced server-side on **every** `/api/admin/*` call
   (`lib/admin-auth.ts`):

   ```bash
   # .env.local (dev) — and the same key in Vercel env vars (step 2 below)
   ADMIN_EMAILS="organizer@cyberwolf.in"
   ```

   Only these comma-separated emails can administer the event; any other
   Google account gets 403 and its Firebase session is dropped immediately.
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
   `firestore.rules` / `storage.rules` at the repo root):

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,storage
   ```
6. **Storage** → default bucket must exist (payment screenshots).

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | client auth (login, registration) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | client |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | client |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | client uploads |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | client |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | client |
| `NEXT_PUBLIC_SITE_URL` | SEO metadata / sitemap — set to the **final domain** |
| `ADMIN_EMAILS` | server admin gate — comma-separated Google emails allowed to sign in to `/admin` (primary gate) |
| `FIREBASE_ADMIN_PROJECT_ID` | server (Admin SDK) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | server (service account email) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | server — keep the literal `\n` escapes |

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

- [ ] `https://<domain>/api/health` → `database: "firebase"`
- [ ] Register a test team end-to-end; check Firestore gets the doc with a
      `WOLF-2026-XXXXX` id and the payment screenshot lands in Storage.
- [ ] Sign in at `/admin/login` with Google using an allowlisted email
      (`ADMIN_EMAILS`). A non-allowlisted Google account must get 403 and be
      signed out immediately.
- [ ] Verify/reject the test registration from `/admin/registrations`.
- [ ] Add your custom domain in Vercel and update `NEXT_PUBLIC_SITE_URL`
      (drives canonical URLs, OpenGraph, sitemap).
- [ ] Confirm security headers: `X-Frame-Options: DENY`, CSP without
      `unsafe-eval` in production, HSTS on.

## 5. Known limits / operational notes

- **Rate limiting is in-memory** (`lib/rate-limit.ts`): per serverless
  instance. Good-enough abuse protection; for strict global limits add
  Upstash Redis later.
- **Dev sign-in button** on `/admin/login` renders only in
  `NODE_ENV=development` — it is dead-code-eliminated from the production
  bundle (verified by grepping `.next/static/chunks`).
- **CSP keeps `'unsafe-inline'`** for scripts: required by Next.js hydration
  without a nonce-based middleware; everything else is locked down.
- Firestore rules (not the app) are the hard boundary for client access;
  server routes always use the Admin SDK.
