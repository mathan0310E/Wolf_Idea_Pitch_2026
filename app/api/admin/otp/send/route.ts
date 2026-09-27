import { NextRequest, NextResponse } from "next/server";
import { randomInt, createHash } from "node:crypto";
import { requireAdminIdentity } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { MAIL_PROVIDER, MailDeliveryError, sendAdminOtpEmail, mailDeliveryAvailable } from "@/lib/mailer";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

// The union Firestore/mock doc ref type has no delete(); narrow locally.
interface OtpDoc {
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
}

// Delivery is synchronous with nodemailer: `transporter.sendMail()` resolves
// only after the SMTP server accepted the message, so there is nothing to poll.
// The former `GET /api/admin/otp/send?mailId=...` delivery-status endpoint is
// therefore gone — POST returns the outcome and `otp_tokens/{uid}` records it.

export async function POST(req: NextRequest) {
  const auth = await requireAdminIdentity(req);
  if ("error" in auth) return auth.error;
  const { uid, email } = auth.admin;

  if (!mailDeliveryAvailable() && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error: "Email delivery is not configured. Admin sign-in is unavailable.",
      },
      { status: 503 }
    );
  }

  const ref = adminDb.collection("otp_tokens").doc(uid) as unknown as OtpDoc;
  let tokenStored = false;

  try {
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : undefined;

    if (existing && typeof existing.createdAt === "string") {
      const age = Date.now() - new Date(existing.createdAt).getTime();
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
    tokenStored = true;

    const mail = await sendAdminOtpEmail(email ?? "", code);

    if (mail.sent) {
      try {
        await ref.update({
          delivery: {
            provider: MAIL_PROVIDER,
            state: mail.delivery,
            attempts: 1,
            messageId: mail.messageId,
            sentAt: now,
          },
        });
      } catch (error) {
        console.error("Admin OTP delivery metadata update failed:", error);
      }
    }

    try {
      await adminDb.collection("auditLogs").add({
        actorUid: uid,
        action: "OTP_SENT",
        targetId: `otp_tokens/${uid}`,
        after: {
          email: email ?? "",
          sent: mail.sent,
          delivery: mail.delivery,
          messageId: mail.messageId,
          ttlMinutes: 5,
        },
        timestamp: now,
      });
    } catch (error) {
      console.error("Admin OTP audit write failed:", error);
    }

    return NextResponse.json({
      success: true,
      email,
      sent: mail.sent,
      delivered: mail.delivery === "SUCCESS",
      messageId: mail.sent ? mail.messageId : null,
      delivery: mail.delivery,
      devNotice: mail.devNotice,
    });
  } catch (error) {
    if (tokenStored) {
      try {
        await ref.delete();
      } catch (cleanupError) {
        console.error("Admin OTP token cleanup failed:", cleanupError);
      }
    }

    if (error instanceof MailDeliveryError) {
      try {
        await adminDb.collection("auditLogs").add({
          actorUid: uid,
          action: "OTP_SEND_FAILED",
          targetId: `otp_tokens/${uid}`,
          after: {
            email: email ?? "",
            reason: error.message.slice(0, 200),
            ttlMinutes: 5,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (auditError) {
        console.error("Admin OTP failure audit write failed:", auditError);
      }

      console.error("Admin OTP delivery failed:", error.message, error.statusCode);
      return NextResponse.json(
        {
          error:
            error.statusCode === 503
              ? "Email delivery is temporarily unavailable. Please try again shortly."
              : "Could not send the verification code. Please try again.",
        },
        { status: error.statusCode }
      );
    }

    console.error("Admin OTP Send Error:", error);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 }
    );
  }
}
