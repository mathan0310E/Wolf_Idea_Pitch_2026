#!/usr/bin/env node
/**
 * Creates (or resets the password of) the admin user for email+password
 * sign-in at /admin/login. The account starts UNVERIFIED — the first sign-in
 * triggers Firebase's verification email, and the server gate
 * (lib/admin-auth.ts) rejects any token with email_verified=false.
 *
 * Usage:
 *   node scripts/create-admin-user.mjs <email> <password> [--reset]
 *
 *   --reset  if the email already exists, update its password instead of
 *            failing (verification status is kept as-is).
 *
 * Credentials come from .env (FIREBASE_ADMIN_*), same as
 * set-admin-claim.mjs. Also add the email to ADMIN_EMAILS in .env —
 * the allowlist is the authorization gate; this script only provisions the
 * identity.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const positional = args.filter((a) => !a.startsWith("--"));
const [email, password] = positional;

if (!email || !password || password.length < 6) {
  console.error(
    "Usage: node scripts/create-admin-user.mjs <email> <password> [--reset]\n" +
      "  <password> must be at least 6 characters (Firebase minimum)."
  );
  process.exit(1);
}

// Load .env without printing any values.
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawKey) {
  console.error(
    "[FATAL] FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / " +
      "FIREBASE_ADMIN_PRIVATE_KEY must be set (see .env.example)."
  );
  process.exit(1);
}

const { initializeApp, cert } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey: rawKey.replace(/\\n/g, "\n"),
  }),
});

const auth = getAuth();

try {
  const user = await auth.createUser({
    email,
    password,
    emailVerified: false,
    disabled: false,
  });
  console.log(`Created admin user ${user.email} (uid: ${user.uid}).`);
} catch (err) {
  if (err?.code === "auth/email-already-exists" && reset) {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password });
    console.log(`Password reset for existing user ${email}.`);
  } else if (err?.code === "auth/email-already-exists") {
    console.error(
      `A user with ${email} already exists. Re-run with --reset to update ` +
        `the password (this does not change verification status).`
    );
    process.exit(1);
  } else {
    console.error("[FATAL]", err?.message || err);
    process.exit(1);
  }
}

console.log(
  `\nNext steps:\n` +
    ` 1. Make sure ADMIN_EMAILS in .env includes ${email}.\n` +
    ` 2. Sign in at /admin/login with this email + password — Firebase\n` +
    `    sends the verification email, and access stays blocked (401/403)\n` +
    `    until the address is verified.\n` +
    ` 3. Enable the Email/Password provider in Firebase Console >\n` +
    `    Authentication > Sign-in method if it is not already enabled.`
);
