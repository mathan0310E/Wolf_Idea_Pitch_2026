import { adminDb, isFirebaseAdminReal } from "@/lib/firebase-admin";

/**
 * Server-side mail delivery for the admin 2FA email OTP — Firebase-native.
 *
 * The OTP email is queued via the Firebase **Trigger Email** extension: we
 * write a document to Firestore `mail/{id}` and the extension delivers it
 * using the provider configured in the Firebase console (SendGrid / SMTP
 * relay in the extension config — no SMTP secrets live in this repo or in
 * Vercel env vars).
 *
 * Document shape follows the extension contract:
 *   { to, message: { subject, text, html } }
 *
 * Fail-closed rules:
 *   - Without real Admin SDK credentials (local mock store) the doc cannot
 *     be queued — in dev the code is logged to the server console so the
 *     flow stays testable; in production the send route returns 503.
 */

export interface OtpMailResult {
  delivered: boolean;
  /** Dev-only: how the code was surfaced when Firebase mail queue is unavailable. */
  devNotice?: string;
}

const OTP_TTL_MINUTES = 5;

/** Firebase mail queue is available whenever the Admin SDK is real. */
export function mailDeliveryAvailable(): boolean {
  return isFirebaseAdminReal();
}

/** @deprecated Use mailDeliveryAvailable — kept so old imports keep working. */
export const smtpConfigured = mailDeliveryAvailable;

export async function sendAdminOtpEmail(
  to: string,
  code: string
): Promise<OtpMailResult> {
  const subject = `WOLF IDEA PITCH 2026 — Admin sign-in code ${code}`;
  const text = [
    "Your Cyber Wolf admin verification code is:",
    "",
    `    ${code}`,
    "",
    `It expires in ${OTP_TTL_MINUTES} minutes and can be used once.`,
    "If you did not request this code, ignore this email — the sign-in attempt cannot complete without it.",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#0a0a0a;font-family:Consolas,monospace;color:#ffffff;">
  <div style="max-width:480px;margin:0 auto;border:1px solid #333;background:#0f0f0f;padding:32px;">
    <p style="margin:0 0 4px;color:#FF0007;font-size:11px;letter-spacing:0.2em;font-weight:bold;">CYBER WOLF &bull; ADMIN PORTAL</p>
    <h1 style="margin:0 0 20px;font-size:20px;">WOLF IDEA PITCH 2026</h1>
    <p style="margin:0 0 16px;font-size:13px;color:#cccccc;">Your admin sign-in verification code:</p>
    <p style="margin:0 0 20px;font-size:36px;letter-spacing:0.35em;font-weight:bold;color:#ffffff;">${code}</p>
    <p style="margin:0;font-size:12px;color:#888888;">Expires in ${OTP_TTL_MINUTES} minutes &bull; single use.<br/>If you did not request this code, ignore this email.</p>
  </div>
</body></html>`;

  // No real Firebase (local mock store) — the Trigger Email extension is not
  // listening, so queueing would vanish silently. Dev: print the code.
  if (!isFirebaseAdminReal()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "firebase-mail-unavailable: Firebase Admin credentials are required in production for admin 2FA"
      );
    }
    console.log(
      `[mailer] DEV MODE — admin OTP for ${to}: ${code} (valid ${OTP_TTL_MINUTES} min, Firebase mail queue unavailable locally)`
    );
    return {
      delivered: false,
      devNotice: `Firebase mail queue is unavailable locally — the code was printed to the server console. Valid ${OTP_TTL_MINUTES} minutes.`,
    };
  }

  // Queue via the Firebase Trigger Email extension (Firestore `mail` collection).
  await adminDb.collection("mail").add({
    to,
    message: { subject, text, html },
  });
  return { delivered: true };
}

