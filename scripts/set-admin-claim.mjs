#!/usr/bin/env node
/**
 * One-command admin claim setter — replaces `firebase functions:shell`,
 * which requires a functions/ directory this project doesn't have.
 *
 * Usage:
 *   node scripts/set-admin-claim.mjs <uid-or-email>   set role:"admin" claim
 *   node scripts/set-admin-claim.mjs --check          verify credentials (no network)
 *
 * Reads FIREBASE_ADMIN_* from .env (falls back to .env.example).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  const path = resolve(root, file);
  if (!existsSync(path)) return null;
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    v = v.replace(/,+$/, ""); // strip stray trailing commas
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(".env") ?? loadEnv(".env.example") ?? {};
const projectId = env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
const rawKey = env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
const privateKey = rawKey.replace(/\\n/g, "\n");
const pemOk =
  privateKey.startsWith("-----BEGIN PRIVATE KEY-----") &&
  privateKey.trimEnd().endsWith("-----END PRIVATE KEY-----");

const arg = (process.argv[2] ?? "").trim();

if (arg === "--check") {
  console.log(`projectId:   ${projectId ? "present" : "MISSING"}`);
  console.log(`clientEmail: ${clientEmail ? "present" : "MISSING"}`);
  console.log(
    `privateKey:  ${rawKey ? (pemOk ? "present, PEM markers OK" : "present, BUT PEM markers look wrong") : "MISSING"}`
  );
  process.exit(0);
}

if (!arg || arg === "--help" || arg === "-h") {
  console.log("Usage: node scripts/set-admin-claim.mjs <uid-or-email>");
  console.log("       node scripts/set-admin-claim.mjs --check");
  process.exit(arg ? 0 : 1);
}

if (!projectId || !clientEmail || !pemOk) {
  console.error("Missing/invalid FIREBASE_ADMIN_* credentials in .env.");
  console.error("Run `node scripts/set-admin-claim.mjs --check` for details.");
  process.exit(1);
}

try {
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const auth = getAuth();

  let uid = arg;
  if (arg.includes("@")) {
    uid = (await auth.getUserByEmail(arg)).uid;
  }
  await auth.setCustomUserClaims(uid, { role: "admin" });
  const user = await auth.getUser(uid);
  console.log(`OK - role:"admin" set for ${user.email || "(no email)"} (uid: ${uid})`);
  console.log("Now sign out and sign in again at /admin/login so the refreshed token carries the claim.");
  process.exit(0);
} catch (err) {
  const code = err?.code ?? "";
  if (code === "auth/user-not-found") {
    console.error("No Firebase Auth user matches that UID/email. Create the user first:");
    console.error("Firebase Console > Authentication > Users > Add user, then re-run this script.");
  } else if (code.includes("invalid-grant") || code.includes("INVALID_ARGUMENT") || code.includes("DECODER")) {
    console.error("Credentials rejected. The private key is usually malformed - re-copy it from the");
    console.error("service-account JSON so it stays on ONE line with literal \\n sequences, no trailing commas.");
  } else {
    console.error(`Failed: ${code || ""} ${err?.message ?? err}`);
  }
  process.exit(1);
}
