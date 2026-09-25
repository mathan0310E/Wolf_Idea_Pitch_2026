import { NextRequest, NextResponse } from "next/server";
import { randomInt, createHash } from "node:crypto";
import { requireAdminIdentity } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminOtpEmail, mailDeliveryAvailable } from "@/lib/mailer";

/**
 * Admin 2FA step 1 — email OTP delivery.
 *
 * POST /api/admin/otp/send  (Bearer Firebase ID token)
 * The caller must ALREADY pass requireAdminIdentity() (valid ID token,
 * verified email, ADMIN_EMAILS allowlist), so this endpoint can never be used
 * as an unauthenticated mail-bombing relay. A 6-digit code is generated,
 * stored hashed (sha256) in Firestore `otp_tokens/{uid}` with a 5-minute TTL,
 * and emailed via the Firebase Trigger Email extension (Firestore `mail`
 * queue — see lib/mailer.ts). Delivery is audited (OTP_SENT) without ever storing
 * or logging the plaintext code.
 */

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

// The union Firestore/mock doc ref type has no delete(); narrow locally.
interface OtpDoc {
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminIdentity(req);
  if ("error" in auth) return auth.error;
  const { uid, email } = auth.admin;

  if (!mailDeliveryAvailable() && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Email delivery is not configured (Firebase Trigger Email extension). Admin sign-in is unavailable." },
      { status: 503 }
    );
  }

  try {
    const ref = adminDb.collection("otp_tokens").doc(uid) as unknown as OtpDoc;
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : undefined;

    // Resend cooldown: one code per minute per admin.
    if (existing && typeof existing.createdAt === "string") {
      const age = Date.now() - new Date(existing.createdAt as string).getTime();
      if (age >= 0 && age < RESEND_COOLDOWN_MS) {
        return NextResponse.json(
          { error: "A code was just sent. Check the inbox or wait a minute to resend." },
          { status: 429 }
        );
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const now = new Date().toISOString();

    await ref.set({
      codeHash: createHash("sha256").update(`${uid}:${code}`).digest("hex"),
      createdAt: now,
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempts: 0,
      email: email ?? "",
    });

    const mail = await sendAdminOtpEmail(email ?? "", code);

    await adminDb.collection("auditLogs").add({
      actorUid: uid,
      action: "OTP_SENT",
      targetId: `otp_tokens/${uid}`,
      after: { email: email ?? "", delivered: mail.delivered, ttlMinutes: 5 },
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      email,
      delivered: mail.delivered,
      devNotice: mail.devNotice,
    });
  } catch (error) {
    console.error("Admin OTP Send Error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.startsWith("firebase-mail-unavailable") || msg.startsWith("smtp-unconfigured")) {
      return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 }
    );
  }
}
