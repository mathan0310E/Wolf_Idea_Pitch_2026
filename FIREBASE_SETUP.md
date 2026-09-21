# Firebase Setup Guide — WOLF IDEA PITCH 2026

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project named `wolf-idea-pitch-2026`.
2. Register a Web App to get `apiKey`, `authDomain`, `projectId`, `storageBucket`, etc.
3. Copy `.env.example` to `.env.local` and fill in the values (never commit `.env.local`).
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL (used for SEO metadata).

## 2. Enable Firebase Services
- **Authentication**: Enable Email/Password auth method.
- **Firestore Database**: Create database in production mode. Apply `firestore.rules`.
- **Storage**: Enable Storage bucket. Apply `storage.rules`.

## 3. Set Admin Custom Claim (REQUIRED)
Admin routes are gated on the `role: "admin"` custom claim — being merely
signed in is not enough. Run this once per admin (Node with Admin SDK creds):

```javascript
const admin = require('firebase-admin');
admin.initializeApp();
async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  console.log(`User ${uid} assigned admin role.`);
}
setAdmin('YOUR_ADMIN_FIREBASE_UID');
```

Then sign that user out and back in (claims refresh on new ID token) and sign
in at `/admin/login`. Without the claim, login shows "not an admin" and every
`/api/admin/*` route returns 401/403.

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
- Without Admin SDK credentials (local dev), the route echoes the data URL
  back so the flow works end-to-end. In production, oversized inline data URLs
  are rejected with 413 — uploads must go through Storage.

