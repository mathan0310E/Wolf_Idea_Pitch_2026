#!/usr/bin/env node
/**
 * Finalize an admin account end-to-end:
 *   1. set role:"admin" custom claim (idempotent)
 *   2. mark email verified (Admin SDK; alternative is clicking the
 *      verification email link Firebase sends on first sign-in)
 *   3. mint a custom token, exchange it for a real ID token (client SDK)
 *   4. hit the live gate with it and print status codes only
 *
 * Usage: node --env-file=.env scripts/admin-finalize.mjs <uid>
 *
 * Prints facts/booleans/status codes only — never tokens or secrets.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const uid = process.argv[2];
if (!uid) {
  console.error("usage: node --env-file=.env scripts/admin-finalize.mjs <uid>");
  process.exit(1);
}

const base = process.env.ADMIN_BASE_URL || "http://localhost:3000";
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
const adminAuth = getAuth();

// 1+2. claims (idempotent) + email verified
await adminAuth.setCustomUserClaims(uid, { role: "admin" });
await adminAuth.updateUser(uid, { emailVerified: true });

// 3. read back facts
const user = await adminAuth.getUser(uid);
const allow = (process.env.ADMIN_EMAILS || "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
console.log(
  "USER_FACTS " +
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      providers: user.providerData.map((p) => p.providerId).join(","),
      customClaims: user.customClaims || {},
      allowlistHasEmail: allow.includes((user.email || "").toLowerCase()),
    })
);

// 4. exchange for a real ID token (picks up the fresh email_verified claim)
const customToken = await adminAuth.createCustomToken(uid, { role: "admin" });
const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!apiKey) {
  console.error("FIREBASE_WEB_API_KEY is missing");
  process.exit(1);
}
let idToken = "";
try {
  const exchanged = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=" +
      encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const payload = await exchanged.json();
  idToken = payload.idToken || "";
  if (!exchanged.ok || !idToken) {
    console.error("token exchange failed", exchanged.status);
    process.exit(1);
  }
} catch {
  console.error("token exchange failed");
  process.exit(1);
}

// 5. prove the gate with the real token — and that junk is still rejected
async function probe(name, path, token) {
  try {
    const res = await fetch(base + path, {
      headers: token ? { Authorization: "Bearer " + token } : {},
    });
    const body = await res.text();
    console.log("PROBE " + name + " -> " + res.status + " " + body.slice(0, 140));
  } catch (e) {
    console.log("PROBE " + name + " -> FETCH-ERROR " + (e?.message || String(e)));
  }
}
await probe("session(valid-admin)", "/api/admin/session", idToken);
await probe("registrations(valid-admin)", "/api/admin/registrations?limit=1", idToken);
await probe("settings-PUT(valid-admin)", "/api/admin/settings", idToken); // GET is public; PUT needs admin
await probe("session(garbage-token)", "/api/admin/session", "not-a-real-token");
await probe("session(no-token)", "/api/admin/session", null);
console.log("DONE");
