# DEPLOYMENT — WOLF IDEA PITCH 2026 (Go-Live Checklist)

The app **fails safe in production**: with no Firebase credentials it refuses to
write data (503) and rejects all admin tokens — it will never silently fake
success. Follow this list to make it fully live.

## 1. Firebase Console (one time)

1. Project ID: `wolf-idea-pitch` (matches `.firebaserc` and `.env` —
   if you ever rename the project, update both).
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
   Admin sign-in is email + password followed by an emailed 6-digit OTP; no
   Google provider is needed. The admin account's email must be verified.
3. Add the organizer's **admin account email** to the allowlist — this is the
   primary admin gate, enforced server-side on **every** `/api/admin/*` call
   (`lib/admin-auth.ts`):

   ```bash
   # .env (dev) — and the same key in Vercel env vars (step 2 below)
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
7. **SMTP for OTP delivery** (the admin 2FA codes — sent with `nodemailer`;
   no Firebase extension, no Blaze plan, no Gmail API/OAuth client): for Gmail,
   enable 2-Step Verification and create an **App Password**, then set
   `SMTP_USER` + `SMTP_PASS` (see `.env.example` — host/port already default to
   `smtp.gmail.com:465`). Any other SMTP provider works by also setting
   `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE`. A real send answers
   `sent: true` + `delivery: "SUCCESS"`. The Firebase project remains on Spark.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Where it's used |
|---|---|
| `FIREBASE_WEB_API_KEY` | server only — admin sign-in. Do not use a `NEXT_PUBLIC_` name |
| `NEXT_PUBLIC_SITE_URL` | SEO metadata / sitemap — set to the **final domain** |
| `ADMIN_EMAILS` | server admin gate — comma-separated admin emails allowed to sign in to `/admin` (primary gate) |
| `FIREBASE_ADMIN_PROJECT_ID` | server (Admin SDK) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | server (service account email) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | server — keep the literal `\n` escapes |
| `SMTP_USER` | server — mailbox that sends the OTP (the Gmail address for Gmail SMTP) |
| `SMTP_PASS` | server — Gmail **App Password** (or any SMTP password); never exposed to the client |
| `SMTP_HOST` | optional — defaults to `smtp.gmail.com` |
| `SMTP_PORT` | optional — defaults to `465` (implicit TLS) |
| `SMTP_SECURE` | optional — `true`/`false`; defaults to `true` on port 465 |
| `SMTP_FROM` | optional — From address, defaults to `SMTP_USER` |
| `SMTP_FROM_NAME` | optional display name |
| `ADMIN_SESSION_SECRET` | optional — signs the httpOnly admin page-gate cookie; when unset it is derived from the Admin SDK key |
Copy `.env.example` for the exact shape. Never commit real values.

## 3. Pre-deploy verification (local, with real env in `.env`)

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
(`node --env-file=.env scripts/live-e2e.mjs [baseUrl]`): registration →
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

## 6. Self-hosting (VPS / Docker)

The same repo also builds a self-contained server bundle for hosts other than
Vercel. `next.config.ts` switches on `VERCEL`: Vercel keeps a plain `.next` build,
everything else builds `output: "standalone"` into `.next/`.

```bash
npm run bundle                  # next build + assemble .next/standalone
npm run bundle -- --tarball     # ...and .next/wolf-idea-pitch-standalone.tar.gz
npm run bundle -- --skip-build  # re-assemble only (reuse an existing .next/)
```

`.next/standalone/` is runnable as-is: `server.js`, the traced `node_modules`
(`sharp` included, so `next/image` works), plus `public/` and `.next/static/` —
`next build` leaves those two out on purpose, `scripts/build-standalone.mjs`
copies them in.

```bash
# local preview (the standalone server ignores .env* - it must be passed)
node --env-file=.env .next/standalone/server.js

# VPS
cd .next/standalone && PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

- `PORT` defaults to 3000, `HOSTNAME` to `0.0.0.0`; put nginx/Caddy in front for TLS.
- Env vars are **not** bundled, except `NEXT_PUBLIC_SITE_URL` and the public
  admin path hash, which are inlined at **build** time. The Firebase web API
  key (`FIREBASE_WEB_API_KEY`), Admin SDK key, SMTP, and `ADMIN_EMAILS` are
  read at **runtime** only and must not use the `NEXT_PUBLIC_` prefix.

Docker (context = this folder, daemon + network required):

```bash
docker build -t wolf-idea-pitch \
  --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain \
  .
docker run --env-file .env -p 3000:3000 wolf-idea-pitch
```

`.dockerignore` excludes `.env*`, so no secret can land in a layer; the `runner`
stage copies only `.next/standalone`, `public/` and `.next/static/`, runs as the
unprivileged `node` user, and carries an `/api/health` healthcheck.

**Verified 2026-09-27** (Next.js 16.3.5, Node 24.19.0, Windows, ports 3311–3313):

| Check | Result |
|---|---|
| `npm run bundle -- --skip-build --tarball` | exit 0; `public/` + 47 static files copied; folder 39.7 MB; tarball 11.7 MB |
| `node .next/standalone/server.js` (no env) | `/api/health` → `"database":"mock"` plus `[FATAL CONFIG]` — proves `.env*` is not auto-read |
| `node --env-file=.env .next/standalone/server.js` | `/api/health` → `"database":"firebase"`; `/` 200 with `WOLF IDEA PITCH` in the HTML; `/faq` 200; unknown path 404; `/bg.png` 200 `image/png`; `/_next/static/...js` 200; CSP from `proxy.ts` present; `/api/admin/session` 401 |
| `npm run start` (local, serves `.next/`) | `/api/health` 200 `firebase`, but Next warns `"next start" does not work with "output: standalone"` — use `node .next/standalone/server.js` |
| `VERCEL=1 npm run build` | exit 0; `.next/next-server.js.nft.json` emitted and standalone is off → the Vercel deploy path is unaffected |
| `docker build` / `docker run` | **not run here** (needs the daemon + network) — verify on the target host |

Do not "simplify" the conditional: Next.js 16.3 stopped writing
`.next/next-server.js.nft.json` while an adapter is active, but Vercel's
`onBuildComplete` still reads it, so `output: "standalone"` on Vercel fails every
deploy (vercel/next.js#96646). Side effect to expect: `next build` rewrites the
`include` entries in `tsconfig.json` for the `.next` build folder. Both
`.next/**` entries are committed, so `tsc` covers the build folder.
