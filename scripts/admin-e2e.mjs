#!/usr/bin/env node
// End-to-end proof of the admin gate: mint a real ID token for the admin user
// (Admin SDK custom token -> identitytoolkit REST exchange, no client SDK needed),
// decode its claims, then call the live gate endpoints. Prints no secrets.
// Run: node --env-file=.env scripts/admin-e2e.mjs [uid]
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const UID = process.argv[2] || "0LutTzGRQPMVfSftmaNnNM9sA572";
const BASE = process.env.BASE_URL || "http://localhost:3000";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!projectId || !clientEmail || !privateKey || !apiKey) {
  console.error(
    "Missing env vars. Run with: node --env-file=.env scripts/admin-e2e.mjs"
  );
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const customToken = await getAuth().createCustomToken(UID, { role: "admin" });

// Exchange the custom token for a real ID token (same call the web SDK makes).
const ex = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  }
);
const exBody = await ex.json();
if (!ex.ok) {
  console.error("TOKEN-EXCHANGE-FAILED:", ex.status, JSON.stringify(exBody).slice(0, 300));
  process.exit(1);
}
const idToken = exBody.idToken;

const payload = JSON.parse(
  Buffer.from(idToken.split(".")[1], "base64").toString("utf8")
);
console.log(
  "[e2e] token claims -> email:",
  payload.email,
  "| email_verified:",
  payload.email_verified,
  "| role:",
  payload.role,
  "| aud:",
  payload.aud
);

const session = await fetch(`${BASE}/api/admin/session`, {
  headers: { Authorization: `Bearer ${idToken}` },
});
const sBody = await session.json().catch(() => ({}));
console.log(
  "[e2e] /api/admin/session ->",
  session.status,
  JSON.stringify(sBody).slice(0, 200)
);

const regs = await fetch(`${BASE}/api/admin/registrations?limit=1`, {
  headers: { Authorization: `Bearer ${idToken}` },
});
console.log("[e2e] /api/admin/registrations ->", regs.status);

console.log(session.ok && regs.ok ? "E2E-PASS" : "E2E-FAIL");
process.exit(session.ok && regs.ok ? 0 : 2);
