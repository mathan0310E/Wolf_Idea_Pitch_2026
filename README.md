# Wolf Idea Pitch

A Next.js application for idea submission and registration with secure payment verification and admin review.

## Tech Stack

- **Framework:** Next.js 16.3.5 (App Router), React 19.2.8
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Email/Password)
- **Admin SDK:** firebase-admin ^14.4.0
- **Email:** Nodemailer ^10.0.10
- **Validation:** Zod ^4.6.5
- **Data Processing:** xlsx ^0.18.5, Papa Parse ^5.7.0
- **UI:** Tailwind CSS 4, lucide-react ^1.47.0, framer-motion ^13.4.0, shadcn ^4.21.0
- **Testing/E2E:** Playwright Core ^1.63.0

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- Firebase project with Firestore enabled
- SMTP account for admin OTP emails (Gmail App Password or provider credentials)

## Setup

1. **Install dependencies**
   `ash
   npm install
   `

2. **Configure environment variables**
   - Copy .env.example to .env
   - Set FIREBASE_WEB_API_KEY (server only — never NEXT_PUBLIC_)
   - Fill in server-only Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
   - Set NEXT_PUBLIC_SITE_URL to your app URL (e.g., http://localhost:3000 or production URL)
   - Set ADMIN_EMAILS as a comma-separated list of admin email addresses
   - Configure SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)

3. **Firebase configuration**
   - Enable Email/Password authentication in Firebase Auth
   - Create a Firestore database in production mode
   - Add authorized domains for your deployment in Firebase Auth
   - Deploy Firestore rules: 
px firebase deploy --only firestore:rules (if using Firebase CLI)

## Scripts

| Script | Description |
|---|---|
| 
pm run dev | Start development server on http://localhost:3000 |
| 
pm run build | Build production application |
| 
pm run start | Start production server |
| 
pm run lint | Run ESLint |
| `npm run bundle` | Build the self-hosted `.next/standalone` bundle (`-- --tarball`, `-- --skip-build`) |

## Build targets

`next.config.ts` produces two different artefacts, chosen by the `VERCEL` env
var so that neither host can break the other:

| Target | Build | Output | Runner |
|---|---|---|---|
| Vercel (production host) | `VERCEL=1 next build` | `.next` | Vercel's Next.js builder |
| Self-hosted (VPS / Docker) | `npm run bundle` or `docker build` | `.next/standalone` (`server.js` + traced `node_modules`, plus `public/` and `.next/static/`) | `node server.js` |

- `output: "standalone"` is on **only** when `VERCEL` is unset. Next.js 16.3 no longer
  writes `.next/next-server.js.nft.json` while an adapter is active but Vercel's
  `onBuildComplete` still reads it, so standalone on Vercel fails the deploy
  (vercel/next.js#96646). Do not make that conditional unconditional.
- Local preview of the bundle: `node --env-file=.env .next/standalone/server.js`.
  (`npm run start` also serves `.next/` locally, but Next warns that `next start` is not
  the runner for standalone output.)
- The standalone server does **not** read `.env*` itself — pass runtime secrets with
  `--env-file` / `-e`. `PORT` defaults to 3000, `HOSTNAME` to `0.0.0.0`.
- `npm run bundle -- --tarball` also writes `.next/wolf-idea-pitch-standalone.tar.gz`;
  `npm run bundle -- --skip-build` re-assembles without rebuilding.
- Full VPS / Docker steps, env-var split and verification evidence:
  DEPLOYMENT.md → "Self-hosting (VPS / Docker)".

## Key Features

### Registration & Payment Submission
- Registrations submit to POST /api/registrations/submit with Zod validation
- **Payment screenshots are submitted as Base64 data** embedded directly in Firestore payments documents (no Firebase Storage upload)
- Screenshot constraints: MAX_SCREENSHOT_BYTES = 512000 (500 KB), allowed MIME types: image/jpeg, image/png, image/webp
- Firestore document size enforcement: FIRESTORE_DOC_LIMIT_BYTES = 1_048_576 with PAYMENT_DOC_HEADROOM_BYTES = 8192
- Duplicate protection: one payment document per 	ransactionId + utr combination

### Status Lookup
- Tokenized status lookup via POST /api/registrations/status
- Rate-limited (30 requests per 60s per client key)
- Requires exact lookupToken authorization for the registration

### Admin Access
- Admin area at /admin (not publicly linked, indexed, or included in sitemaps)
- Admin authentication enforced via ADMIN_EMAILS allowlist and Firebase Admin SDK
- Email OTP verification required for admin sessions (otp_verified/{uid} valid for 12 hours)
- All admin actions are logged to immutable audit logs
- Direct Firestore admin access requires 
equest.auth.token.role === 'admin'

## Security

- Strict security headers via proxy.ts (CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy, HSTS in production)
- Zero-trust fee calculation and atomic ID generation
- 64-character lookup tokens for status access
- CSV injection protection for exports
- Generic server errors; PII is masked in SMTP/log failures
- No secrets committed; use environment variables only

## Deployment

- Build: 
pm run build
- Start: 
pm run start
- Environment variables must be configured in your hosting platform (Vercel, etc.)
- Ensure Firebase Auth authorized domains include your production domain
- Verify NEXT_PUBLIC_SITE_URL matches production URL

## Validation

- Lint: 
pm run lint
- Production build must succeed without errors
- Firestore rules validated against application access patterns
- Admin OTP flow and status lookup verified in staging before production

## Notes

- The deprecated screenshot upload endpoint (POST /api/uploads/screenshot) returns 410 Gone
- Firebase Storage is not used by this application
- /admin is intentionally not discoverable (no links, blocked by robots/sitemap)
