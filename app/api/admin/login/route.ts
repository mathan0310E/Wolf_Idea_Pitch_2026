import { NextRequest, NextResponse } from "next/server";
import { signInWithPassword } from "@/lib/firebase-identity";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/admin-audit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/admin/login { email, password }
 * Signs in with the Firebase web API key on the server. The key is not
 * returned and is not part of the client bundle. The ID token is handed
 * to the browser only after the email is verified; OTP still has to pass
 * before an admin session is stored.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(clientKey(req, "admin-login"), 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!EMAIL.test(email) || email.length > 254 || password.length < 1 || password.length > 200) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  const result = await signInWithPassword(email, password);
  if (!result.ok) {
    if (result.code !== "unverified") {
      try {
        await writeAuditLog({
          actorUid: "anonymous",
          action: "ADMIN_LOGIN_FAILED",
          targetId: "sign-in",
        });
      } catch (error) {
        console.error("Login audit write failed:", error);
      }
    }
    if (result.code === "unverified") {
      return NextResponse.json(
        {
          error:
            "This email address is not verified. A verification link was sent when possible. Open it, then sign in again.",
        },
        { status: 403 }
      );
    }
    if (result.code === "too-many-requests") {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again in a few minutes." },
        { status: 429 }
      );
    }
    if (result.code === "user-disabled") {
      return NextResponse.json(
        { error: "This account has been disabled." },
        { status: 403 }
      );
    }
    if (result.code === "unavailable") {
      return NextResponse.json(
        { error: "Sign-in is unavailable right now. Please try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, idToken: result.idToken });
}
