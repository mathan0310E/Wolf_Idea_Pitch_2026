#!/usr/bin/env node
/**
 * Live end-to-end verification — WOLF IDEA PITCH 2026 go-live checklist items
 * (2) register a team, (3) admin email+OTP 2FA sign-in, (4) verify/reject.
 *
 * Drives the REAL API surface against a real production server (`next start`)
 * backed by the live Firebase project, and asserts the Firestore side effects
 * with the Admin SDK. Writes exactly ONE test registration + its payment doc,
 * then rejects it (leaving a clean audit trail).
 *
 * Run: node --env-file=.env.local scripts/live-e2e.mjs [baseUrl]
 *
 * Prints NO secrets: no private key, no ID token, no OTP code (masked), no
 * lookup token (masked), no screenshot data.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || process.env.BASE_URL || "http://localhost:3210";
const STAMP = Date.now();
const results = [];
const notes = [];

function record(name, ok, detail = "") {
  results.push({ name, ok });
  const tag = ok === true ? "PASS" : ok === false ? "FAIL" : "INFO";
  console.log(`${tag}  ${name}${detail ? " :: " + detail : ""}`);
}
const note = (s) => { notes.push(s); console.log("INFO  " + s); };
const mask = (s) => (typeof s === "string" && s.length > 4 ? s.slice(0, 4) + "..." + s.slice(-2) : "...");

async function req(method, p, { token, body } = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: res.status, text, json };
}

// ---- env + admin SDK -------------------------------------------------------
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const allowlist = (process.env.ADMIN_EMAILS || "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

if (!projectId || !clientEmail || !privateKey || !apiKey) {
  console.error("Missing env. Run with: node --env-file=.env.local scripts/live-e2e.mjs");
  process.exit(1);
}
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
const adminAuth = getAuth();
const db = getFirestore();

console.log(`[live-e2e] base=${BASE} project=${projectId} allowlistEntries=${allowlist.length}`);

// ---- 0. server + health ----------------------------------------------------
{
  const health = await req("GET", "/api/health");
  record("health endpoint 200 + database=firebase",
    health.status === 200 && health.json?.database === "firebase",
    `${health.status} database=${health.json?.database}`);
}

// ---- 1. registration: submit (checklist item 2) ----------------------------
const shotPath = path.join(process.cwd(), "public", "favicon-16.png");
let shot;
try { shot = readFileSync(shotPath); }
catch { console.error(`Cannot read ${shotPath} - run from the project root.`); process.exit(1); }
const shotB64 = shot.toString("base64");

const payload = {
  teamName: `E2E VERIFY ${STAMP}`,
  teamType: "individual",
  domain: "E2E-VERIFICATION (automated test - safe to reject)",
  members: [{
    name: "E2E Test Participant",
    email: `e2e+${STAMP}@example.com`,
    phone: "9000000001",
    college: "E2E Verification College",
    department: "Automated Test",
    year: "1st Year",
    registerNumber: `E2E-${STAMP}`,
    isTeamLeader: true,
  }],
  transactionId: `E2ETXN${STAMP}`,
  utr: `E2EUTR${STAMP}`,
  screenshotBase64: shotB64,
  screenshotMimeType: "image/png",
  screenshotSize: shot.length,
  termsAccepted: true,
};

const submit = await req("POST", "/api/registrations/submit", { body: payload });
const registrationId = submit.json?.registrationId;
const lookupToken = submit.json?.lookupToken;
record("registration submit 200 + WOLF-2026-XXXXX id",
  submit.status === 200 && /^WOLF-2026-\d{5}$/.test(String(registrationId)),
  `${submit.status} id=${registrationId} token=${mask(lookupToken)}`);

if (submit.status !== 200) {
  console.error("submit body:", submit.text.slice(0, 400));
  console.log("SUMMARY", JSON.stringify({ pass: 0, fail: results.length }));
  process.exit(2);
}
note(`test registration created: ${registrationId} (sequence counter consumed - see side effects)`);

// negative: the transactionId+utr pair must not be accepted twice
{
  const dup = await req("POST", "/api/registrations/submit", { body: payload });
  record("duplicate transactionId+utr rejected (409)", dup.status === 409, `${dup.status}`);
}

// ---- 2. Firestore side effects (heart of checklist item 2) -----------------
const regSnap = await db.collection("registrations").doc(registrationId).get();
record("registrations/{id} document exists", regSnap.exists);
if (regSnap.exists) {
  const r = regSnap.data();
  record("  registration fields server-computed (amount=300, memberCount=1, SUBMITTED)",
    r.totalAmount === 300 && r.memberCount === 1 && r.registrationStatus === "SUBMITTED" &&
    r.paymentStatus === "SUBMITTED" && typeof r.lookupToken === "string" && r.lookupToken.length === 64,
    `amount=${r.totalAmount} members=${r.memberCount} reg=${r.registrationStatus} pay=${r.paymentStatus}`);
  record("  screenshot metadata stored, image NOT in the registration doc",
    r.screenshotMeta?.mimeType === "image/png" && r.screenshotMeta?.size === shot.length &&
    r.screenshotBase64 === undefined,
    `meta=${JSON.stringify(r.screenshotMeta)}`);
}

const paySnap = await db.collection("payments").doc(`PAY-${registrationId}`).get();
record("payments/PAY-{id} document exists (screenshot destination)", paySnap.exists);
if (paySnap.exists) {
  const p = paySnap.data();
  record("  Base64 screenshot stored byte-exact in the Firestore payment doc",
    typeof p.screenshotBase64 === "string" && p.screenshotBase64.length === shotB64.length &&
    p.screenshotSize === shot.length && p.status === "SUBMITTED",
    `b64len=${p.screenshotBase64?.length} size=${p.screenshotSize} status=${p.status}`);
}

// Documented contract: the Storage upload endpoint is gone (410); screenshots
// live in Firestore. Guards the docs against drifting back to "Storage".
{
  const up = await req("POST", "/api/uploads/screenshot");
  record("Storage upload endpoint is 410 Gone (screenshots live in Firestore)",
    up.status === 410, `${up.status}`);
}

// ---- 3. participant status lookup ------------------------------------------
{
  const okRes = await req("POST", "/api/registrations/status",
    { body: { registrationId, lookupToken } });
  record("status lookup with valid token 200 + SUBMITTED",
    okRes.status === 200 && okRes.json?.registration?.registrationStatus === "SUBMITTED",
    `${okRes.status}`);
  const bad = await req("POST", "/api/registrations/status",
    { body: { registrationId, lookupToken: "0".repeat(64) } });
  record("status lookup with wrong token 403", bad.status === 403, `${bad.status}`);
}

// ---- 4. admin identity + 2FA gate (checklist item 3) -----------------------
let idToken = null;
let adminUid = null;
let hadFreshOtp = false;
{
  const listed = await adminAuth.listUsers(1000);
  const adminUser = listed.users.find((u) => allowlist.includes((u.email || "").toLowerCase()));
  if (!adminUser) {
    record("an ADMIN_EMAILS account exists in Firebase Auth", false,
      `${listed.users.length} user(s), none allowlisted - create one with scripts/create-admin-user.mjs`);
  } else {
    adminUid = adminUser.uid;
    const verifiedAt = (await db.collection("otp_verified").doc(adminUid).get()).data()?.verifiedAt;
    const ageMs = typeof verifiedAt === "string" ? Date.now() - new Date(verifiedAt).getTime() : Infinity;
    hadFreshOtp = ageMs >= 0 && ageMs < 12 * 60 * 60 * 1000;
    record("an ADMIN_EMAILS account exists in Firebase Auth", true,
      `uid=${adminUid} emailVerified=${adminUser.emailVerified} freshOtpVerifiedDoc=${hadFreshOtp}`);

    const customToken = await adminAuth.createCustomToken(adminUid, { role: "admin" });
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
      record("custom token exchanged for a real ID token", false,
        `HTTP ${ex.status} ${String(exBody?.error?.message)}`);
    } else {
      idToken = exBody.idToken;
      record("custom token exchanged for a real ID token", true, "ID token minted (never printed)");

      const s1 = await req("GET", "/api/admin/session", { token: idToken });
      if (hadFreshOtp) {
        record("session probe before OTP", "info",
          `${s1.status} (a fresh otp_verified doc already existed, so the 403 branch is not re-provable)`);
      } else {
        record("ID token alone is NOT enough - session 403 'two-factor verification required'",
          s1.status === 403 && /two-factor/i.test(s1.text), `${s1.status} ${s1.text.slice(0, 90)}`);
      }
    }
  }
}

// ---- 5. email OTP 2FA round trip (checklist item 3, second half) -----------
const mailCount = async () => {
  try { return (await db.collection("mail").count().get()).data().count; } catch { return null; }
};
let otpCode = null;
if (idToken && adminUid) {
  const mailBefore = await mailCount();
  const sent = await req("POST", "/api/admin/otp/send", { token: idToken });
  record("otp/send 200 + delivered:true", sent.status === 200 && sent.json?.delivered === true,
    `${sent.status} delivered=${sent.json?.delivered}`);

  const mailAfter = await mailCount();
  record("  a mail/{id} doc was queued for the Trigger Email extension",
    mailBefore === null || mailAfter === null ? "info" : mailAfter === mailBefore + 1,
    `mail docs ${mailBefore} -> ${mailAfter} (the extension performs the actual send)`);

  const otpDoc = (await db.collection("otp_tokens").doc(adminUid).get()).data();
  record("  otp_tokens/{uid} holds a salted hash, never the plaintext code",
    typeof otpDoc?.codeHash === "string" && otpDoc.codeHash.length === 64 && otpDoc.code === undefined,
    `expiresAt=${otpDoc?.expiresAt} attempts=${otpDoc?.attempts}`);

  if (typeof otpDoc?.codeHash === "string") {
    // The code is only recoverable by hashing the 10^6 candidate space. This is
    // a test-only shortcut so the flow can be driven without reading the
    // organizer's inbox; it also shows a 6-digit code + unsalted hash is not a
    // strong secret on its own.
    const t0 = Date.now();
    for (let i = 0; i < 1_000_000 && otpCode === null; i += 1) {
      const c = String(i).padStart(6, "0");
      if (createHash("sha256").update(`${adminUid}:${c}`).digest("hex") === otpDoc.codeHash) otpCode = c;
    }
    record("  code recovered from the hash (test-only brute force)",
      otpCode !== null, `code=${mask(otpCode)} in ${Date.now() - t0} ms`);

    const wrong = otpCode === null ? "000000" : String((Number(otpCode) + 1) % 1000000).padStart(6, "0");
    const badTry = await req("POST", "/api/admin/otp/verify", { token: idToken, body: { code: wrong } });
    const attempts = (await db.collection("otp_tokens").doc(adminUid).get()).data()?.attempts;
    record("  wrong code rejected 400 + attempt counter incremented",
      badTry.status === 400 && attempts === 1, `${badTry.status} attempts=${attempts}`);

    const verify = await req("POST", "/api/admin/otp/verify", { token: idToken, body: { code: otpCode } });
    record("  correct code verified 200", verify.status === 200, `${verify.status}`);

    const tokenGone = !(await db.collection("otp_tokens").doc(adminUid).get()).exists;
    const verifiedDoc = await db.collection("otp_verified").doc(adminUid).get();
    record("  OTP is single-use + otp_verified/{uid} recorded",
      tokenGone && verifiedDoc.exists, `tokenConsumed=${tokenGone} verifiedAt=${verifiedDoc.data()?.verifiedAt}`);

    const s2 = await req("GET", "/api/admin/session", { token: idToken });
    record("session 200 once 2FA is satisfied", s2.status === 200, `${s2.status}`);
  }
}

// ---- 6. admin sees it, views the proof, rejects it (checklist item 4) ------
if (idToken) {
  const list = await req("GET", "/api/admin/registrations?limit=100", { token: idToken });
  const mine = Array.isArray(list.json?.registrations)
    ? list.json.registrations.find((r) => r.registrationId === registrationId)
    : undefined;
  record("admin registrations feed lists the test registration",
    list.status === 200 && !!mine, `${list.status} total=${list.json?.total} found=${!!mine}`);
  record("  lookupToken is stripped from the admin feed",
    mine ? mine.lookupToken === undefined : "info");

  const shotRes = await req("GET",
    `/api/admin/verify?screenshot=1&registrationId=${registrationId}`, { token: idToken });
  record("admin can retrieve the payment screenshot as a data URL",
    shotRes.status === 200 &&
    String(shotRes.json?.dataUrl || "").startsWith("data:image/png;base64,") &&
    shotRes.json?.size === shot.length,
    `${shotRes.status} size=${shotRes.json?.size}`);

  const reject = await req("POST", "/api/admin/verify", {
    token: idToken,
    body: {
      registrationId,
      status: "REJECTED",
      rejectionReason: "Automated end-to-end verification test - not a real submission",
    },
  });
  record("admin rejects the test registration", reject.status === 200,
    `${reject.status} ${reject.text.slice(0, 70)}`);

  const reg2 = (await db.collection("registrations").doc(registrationId).get()).data();
  const pay2 = (await db.collection("payments").doc(`PAY-${registrationId}`).get()).data();
  record("  Firestore reflects REJECTED + reason on both documents",
    reg2?.registrationStatus === "REJECTED" && reg2?.paymentStatus === "REJECTED" &&
    !!reg2?.rejectionReason && pay2?.status === "REJECTED",
    `reg=${reg2?.registrationStatus} pay=${pay2?.status}`);

  const after = await req("POST", "/api/registrations/status",
    { body: { registrationId, lookupToken } });
  record("  participant status lookup now reports REJECTED + reason",
    after.status === 200 && after.json?.registration?.registrationStatus === "REJECTED" &&
    !!after.json?.registration?.rejectionReason,
    `${after.status} ${after.json?.registration?.registrationStatus}`);

  const logs = await req("GET", "/api/admin/audit-logs", { token: idToken });
  const actions = new Set((logs.json?.logs || []).map((l) => l.action));
  const required = ["PAYMENT_SUBMITTED", "PAYMENT_SCREENSHOT_UPLOADED", "OTP_SENT",
    "OTP_FAILED", "OTP_VERIFIED", "PAYMENT_SCREENSHOT_VIEWED", "PAYMENT_REJECTED"];
  const missing = required.filter((a) => !actions.has(a));
  record("audit log records the entire lifecycle", missing.length === 0,
    missing.length ? `missing: ${missing.join(", ")}` : `${required.length}/${required.length} present`);
}

// ---- summary + side effects ------------------------------------------------
const pass = results.filter((r) => r.ok === true).length;
const fail = results.filter((r) => r.ok === false).length;
const info = results.filter((r) => r.ok !== true && r.ok !== false).length;

console.log("\nSIDE EFFECTS ON THE LIVE FIREBASE PROJECT");
console.log(`  registrations/${registrationId} + payments/PAY-${registrationId} (REJECTED, reason recorded)`);
console.log("  auditLogs entries are append-only by design (no deletes)");
console.log("  one mail/{id} doc queued - actual inbox delivery is the Trigger Email extension's job");
console.log(`  settings/sequence advanced past ${registrationId}`);
notes.forEach((n) => console.log("  note: " + n));
console.log(`\nSUMMARY ${JSON.stringify({ pass, fail, info })}`);
process.exit(fail > 0 ? 2 : 0);




