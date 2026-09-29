import { NextRequest, NextResponse } from "next/server";
import { sendPasswordReset } from "@/lib/firebase-identity";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SAME_ANSWER = {
  ok: true,
  message: "If that email is registered, a password reset link has been sent.",
};

/**
 * POST /api/admin/password-reset { email }
 * The response does not reveal whether the address exists, and the
 * Firebase API key stays on the server.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(clientKey(req, "admin-reset"), 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json(SAME_ANSWER);
  }

  const result = await sendPasswordReset(email);
  if (result === "limited") {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }
  if (result === "unavailable") {
    return NextResponse.json(
      { error: "Could not send a reset email. Please try again." },
      { status: 503 }
    );
  }
  return NextResponse.json(SAME_ANSWER);
}
