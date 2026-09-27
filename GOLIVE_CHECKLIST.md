# Go-Live Checklist — WOLF IDEA PITCH 2026

Use this checklist to verify the project is production-ready before launch.

---

## 📋 Pre-Launch Checklist

### 1. Firebase Console Configuration

- [ ] Firebase project created with ID `wolf-idea-pitch` (or updated in `.firebaserc`)
- [ ] Email/Password authentication enabled
- [ ] Admin account created with **verified email**
- [ ] Authorized domains include production domain (not just localhost)
- [ ] Firestore database created in **production mode**
- [x] No Firebase Storage bucket needed (screenshots are Base64 in a Firestore `payments` doc) ✅
- [ ] SMTP sender configured: a Gmail App Password set as `SMTP_USER` + `SMTP_PASS` (no Blaze plan required)
- [x] Firestore rules deployed: `npx firebase-tools deploy --only firestore:rules` ✅
- [ ] Admin email added to `ADMIN_EMAILS` env var

### 2. Environment Variables (Vercel → Project Settings → Environment Variables)

**Required Public Variables:**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_SITE_URL` — set to final production domain

**Required Server Variables:**
- [ ] `ADMIN_EMAILS` — comma-separated admin emails
- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY`
- [ ] `SMTP_USER` — sending mailbox (e.g. the Gmail address)
- [ ] `SMTP_PASS` — Gmail App Password (16 characters; not the account password)
- [ ] `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` — optional; default to `smtp.gmail.com:465`
- [ ] `SMTP_FROM` / `SMTP_FROM_NAME` — optional sender identity
- [ ] `ADMIN_SESSION_SECRET` — optional; signs the httpOnly admin page-gate cookie (derived from the Admin SDK key when unset)

### 3. Event Configuration (config/event.ts)

- [ ] UPI ID replaced: `payment.upiId`
- [ ] Beneficiary name replaced: `payment.beneficiaryName`
- [ ] Instagram URL replaced: `socials.instagram`
- [ ] LinkedIn URL replaced: `socials.linkedin`
- [ ] All 4 theme titles replaced with real themes
- [ ] All 4 theme descriptions filled in
- [ ] Schedule times filled in for all 5 schedule slots
- [ ] Registration gate status set correctly (`open: true/false`)

### 4. Domain & SEO

- [ ] Custom domain added in Vercel (if using one)
- [ ] `NEXT_PUBLIC_SITE_URL` updated to production domain
- [ ] robots.txt updated with correct domain
- [ ] sitemap.xml updated with correct domain
- [ ] OG image (`public/og-image.png`) is appropriate
- [ ] Favicon and app icons are appropriate
- [ ] PWA manifest is configured

### 5. Security Verification

- [ ] Production build includes security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] `/admin/` routes are disallowed in robots.txt
- [ ] Firebase rules deny client access to `otp_tokens`, `otp_verified`
- [ ] Admin allowlist (`ADMIN_EMAILS`) is set
- [ ] No secrets in code (API keys, passwords, etc.)
- [ ] Dependencies are up to date (`npm audit` clean or acceptable)

### 6. Functional Testing

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Registration page shows correct fee calculation
- [ ] Registration form validates input correctly
- [x] Screenshot storage works (JPG/PNG/WEBP, ≤500 KB; stored as Base64 in
      the `payments` Firestore doc — `POST /api/uploads/screenshot` is `410 Gone`,
      Firebase Storage uploads are not used) ✅ API-verified
- [x] Registration submission creates Firestore document ✅ API-verified
- [x] Status lookup works with registration ID + lookup token ✅ API-verified
- [x] Admin login works (email + password + OTP) ✅ API-verified
- [x] Admin dashboard shows registrations ✅ API-verified (bug fixed)
- [x] Admin can verify/reject registrations ✅ API-verified
- [x] Admin audit logs record OTP_SENT, OTP_VERIFIED, etc. ✅ API-verified
- [x] Health endpoint returns `{"database":"firebase"}` ✅ API-verified

### 7. Mobile & Cross-Browser

- [ ] Site looks good on mobile (375px width)
- [ ] Site looks good on tablet (768px width)
- [ ] Site looks good on desktop (1280px+ width)
- [ ] Tested on Chrome, Firefox, Safari, Edge
- [ ] Mobile menu works correctly
- [ ] Touch interactions work (no hover-only features)

### 8. Performance

- [ ] Lighthouse score acceptable (performance, accessibility, best practices, SEO)
- [ ] Images are optimized (use <Image> component)
- [ ] Fonts load efficiently (next/font handles this)
- [ ] Animations respect prefers-reduced-motion
- [ ] Build produces no console errors

---

## 🚀 Deployment Steps

### Option A: Deploy to Vercel (Recommended)

1. Push code to GitHub/GitLab
2. Import project in Vercel dashboard
3. Configure all environment variables
4. Deploy

### Option B: Manual Deployment (VPS / Docker)

```bash
# Build the self-hosted bundle -> dist/standalone (see DEPLOYMENT.md "Self-hosting")
npm run bundle -- --tarball

# Run it - the standalone server does NOT read .env*, pass the env explicitly
node --env-file=.env.local dist/standalone/server.js

# Verify health endpoint
curl http://localhost:3000/api/health
# Expected: {"ok":true,"database":"firebase"}

# Deploy Firebase rules
npx firebase-tools deploy --only firestore:rules
```

On Vercel, use Option A: `next.config.ts` builds a plain `.next` there (Vercel sets
`VERCEL=1`) and deliberately skips the standalone bundle.

---

## ✅ Post-Launch Verification

- [ ] `https://<your-domain>/api/health` returns `{"database":"firebase"}` ✅ API-verified
- [ ] Register a test team end-to-end ✅ API-verified
- [x ] Verify registration appears in Firestore ✅ API-verified
- [ ] Verify payment screenshot stored in the Firestore `payments` document (Base64) ✅ API-verified
- [ ] Admin can see registration in dashboard ✅ API-verified
- [ ] Status lookup works for the test registration ✅ API-verified
- [ ] Security headers present in production response ✅ verified via curl
- [ ] All social links work (if configured)
- [ ] Contact form/info is accurate

---

## 🆘 Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| Admin login fails | Check `ADMIN_EMAILS`, verify the Firebase Auth email, and confirm `SMTP_USER` + `SMTP_PASS` are set |
| OTP not received | Check the sender mailbox quota, that `SMTP_PASS` is an App Password on an account with 2-Step Verification, and the `delivery` result on the OTP request |
| Firebase auth errors | Check authorized domains in Firebase Console, verify all NEXT_PUBLIC_* env vars |
| Build fails | Run `npx tsc --noEmit` and `npm run lint` to find issues |
| Registration submission fails | Check Firestore rules allow the API route to write (Admin SDK bypasses rules) |
| Screenshot storage fails | Verify file is JPG/PNG/WEBP and ≤500 KB; saved Base64 in the Firestore `payments` doc (no Storage upload; `POST /uploads/screenshot` is 410 Gone) |

---

## 📞 Need Help?

Contact the Cyber Wolf team:
- 📧 Email: info@cyberwolf360.in
- 📱 Phone/WhatsApp: +91 63798 69678
