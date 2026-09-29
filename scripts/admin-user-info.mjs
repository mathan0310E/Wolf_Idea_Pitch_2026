#!/usr/bin/env node
// Prints NON-SECRET facts about a Firebase Auth user so admin configuration
// can be verified safely (uid / email / verified / claim / allowlist match).
// Never prints credentials. Usage:
//   node --env-file=.env scripts/admin-user-info.mjs <uid-or-email>
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const {
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
  ADMIN_EMAILS,
} = process.env;

if (
  !FIREBASE_ADMIN_PROJECT_ID ||
  !FIREBASE_ADMIN_CLIENT_EMAIL ||
  !FIREBASE_ADMIN_PRIVATE_KEY
) {
  console.error("missing-admin-creds: set FIREBASE_ADMIN_* in .env");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const who = process.argv[2];
if (!who) {
  console.error(
    "usage: node --env-file=.env scripts/admin-user-info.mjs <uid-or-email>"
  );
  process.exit(1);
}

try {
  const user = who.includes("@")
    ? await getAuth().getUserByEmail(who)
    : await getAuth().getUser(who);
  const allow = (ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  console.log(
    JSON.stringify(
      {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        providers: (user.providerData || []).map((p) => p.providerId),
        hasAdminClaim: user.customClaims?.role === "admin",
        onAllowlist: allow.includes(String(user.email || "").toLowerCase()),
        creationTime: user.metadata?.creationTime,
      },
      null,
      2
    )
  );
} catch (err) {
  console.error("lookup-failed:", err.code || err.message);
  process.exit(2);
}
