import nodemailer from "nodemailer";

/** Derived from the factory so this file never depends on the package's type layout. */
type SmtpTransporter = ReturnType<typeof nodemailer.createTransport>;

export interface OtpMailResult {
  sent: boolean;
  messageId: string;
  delivery: "SUCCESS" | "UNPROCESSED";
  devNotice?: string;
}

export class MailDeliveryError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "MailDeliveryError";
  }
}

/** Recorded as `delivery.provider` on `otp_tokens/{uid}`. */
export const MAIL_PROVIDER = "smtp";

const OTP_TTL_MINUTES = 5;
const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_PORT = 465;
const CONNECTION_TIMEOUT_MS = 8_000;
const GREETING_TIMEOUT_MS = 8_000;
const SOCKET_TIMEOUT_MS = 15_000;

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
};

/**
 * SMTP delivery needs only a mailbox plus a password/App Password:
 * `SMTP_USER` and `SMTP_PASS`. Everything else has a Gmail-friendly default
 * (`smtp.gmail.com:465`), so a Gmail sender works with two variables, while
 * `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` open the door to any other provider.
 */
export function mailDeliveryAvailable(): boolean {
  return [process.env.SMTP_USER, process.env.SMTP_PASS].every((value) =>
    Boolean(value?.trim())
  );
}

function resolvePort(): number {
  const raw = process.env.SMTP_PORT?.trim();
  if (!raw) return DEFAULT_SMTP_PORT;
  const port = Number(raw);
  return Number.isInteger(port) && port > 0 && port <= 65535
    ? port
    : DEFAULT_SMTP_PORT;
}

/** Implicit TLS on 465 unless SMTP_SECURE (or a different port) says otherwise. */
function resolveSecure(port: number): boolean {
  const raw = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return port === 465;
}

function getSmtpConfig(): SmtpConfig {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) {
    throw new MailDeliveryError("smtp-unconfigured", 503);
  }

  const port = resolvePort();

  return {
    host: process.env.SMTP_HOST?.trim() || DEFAULT_SMTP_HOST,
    port,
    secure: resolveSecure(port),
    user,
    pass,
    fromEmail: process.env.SMTP_FROM?.trim() || user,
    fromName: process.env.SMTP_FROM_NAME?.trim() || "WOLF IDEA PITCH",
  };
}

let cachedTransport: { key: string; transporter: SmtpTransporter } | null = null;

/**
 * One transporter per (host, port, user, password) configuration, reused inside
 * a warm serverless instance. Pooling stays off so an idle instance never holds
 * an SMTP connection open.
 */
function getTransport(config: SmtpConfig): SmtpTransporter {
  const key = [
    config.host,
    config.port,
    config.secure,
    config.user,
    config.pass,
  ].join("|");
  if (cachedTransport?.key === key) return cachedTransport.transporter;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    pool: false,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
    tls: { minVersion: "TLSv1.2" },
  });

  cachedTransport = { key, transporter };
  return transporter;
}

/**
 * Turns any SMTP failure into a safe error. Only the short code reaches logs,
 * responses and audit entries, so an SMTP banner (which can echo the recipient
 * address or the provider) never leaks into the API surface.
 */
function classifySmtpError(error: unknown): MailDeliveryError {
  const candidate = error as { code?: unknown; responseCode?: unknown };
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const responseCode =
    typeof candidate?.responseCode === "number" ? candidate.responseCode : 0;

  if (code === "EAUTH") return new MailDeliveryError("smtp-auth", 502);
  if (code === "EENVELOPE") return new MailDeliveryError("smtp-envelope", 502);

  // 4xx is transient ("try again later"); 5xx is a permanent rejection.
  if (responseCode >= 400 && responseCode < 500) {
    return new MailDeliveryError(`smtp-${responseCode}`, 503);
  }
  if (responseCode >= 500) {
    return new MailDeliveryError(`smtp-${responseCode}`, 502);
  }

  if (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "ECONNREFUSED" ||
    code === "EHOSTUNREACH" ||
    code === "EDNS"
  ) {
    return new MailDeliveryError(`smtp-${code.toLowerCase()}`, 503);
  }
  if (code.startsWith("ERR_TLS") || code === "ETLS") {
    return new MailDeliveryError("smtp-tls", 502);
  }

  return new MailDeliveryError("smtp-send-failed", 502);
}

/**
 * Sends one multipart message (plain text + branded HTML) and returns the SMTP
 * message id (`info.messageId`). Nodemailer builds the MIME body and encodes the
 * headers itself, so there is no hand-rolled message here and no
 * header-injection surface — recipient and subject are passed as values.
 */
async function deliverMessage(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  config: SmtpConfig;
}): Promise<string> {
  const { to, subject, text, html, config } = params;

  try {
    const info = await getTransport(config).sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to,
      subject,
      text,
      html,
    });

    const messageId = (info as { messageId?: unknown }).messageId;
    if (typeof messageId !== "string" || !messageId) {
      throw new MailDeliveryError("smtp-send-id", 502);
    }
    return messageId;
  } catch (error) {
    if (error instanceof MailDeliveryError) throw error;
    throw classifySmtpError(error);
  }
}

export async function sendAdminOtpEmail(
  to: string,
  code: string
): Promise<OtpMailResult> {
  const subject = "WOLF IDEA PITCH 2026 — Admin sign-in code";
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

  if (!mailDeliveryAvailable()) {
    if (process.env.NODE_ENV === "production") {
      throw new MailDeliveryError("smtp-unconfigured", 503);
    }
    console.warn(
      "[mailer] SMTP is not configured; the development OTP was not sent."
    );
    return {
      sent: false,
      messageId: "",
      delivery: "UNPROCESSED",
      devNotice:
        "SMTP is not configured for local development. Set SMTP_USER and SMTP_PASS (see .env.example) to send the code.",
    };
  }

  const config = getSmtpConfig();
  const messageId = await deliverMessage({ to, subject, text, html, config });
  return { sent: true, messageId, delivery: "SUCCESS" };
}

