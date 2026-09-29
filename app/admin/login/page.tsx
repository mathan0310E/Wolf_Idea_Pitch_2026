"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { adminHref } from "@/lib/admin-path";
import { AlertCircle, MailCheck, RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";

/** Mirrors `delivery` in the /api/admin/otp/send response (lib/mailer.ts). */
type OtpSendOutcome = "SUCCESS" | "UNPROCESSED";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [stage, setStage] = React.useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const pendingToken = React.useRef("");

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const finishSignIn = async (idToken: string) => {
    // Server-side gate: requireAdmin() in lib/admin-auth.ts enforces the
    // ADMIN_EMAILS allowlist AND the email_verified claim on every
    // /api/admin/* route. The session is stored only after the server
    // confirms this account is authorized.
    const res = await fetch("/api/admin/session", {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      pendingToken.current = "";
      setStage("form");
      setError(data.error || "This account is not authorized for admin access.");
      return;
    }

    sessionStorage.setItem("wolf_admin_session", idToken);
    router.push(adminHref("/dashboard"));
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const signInRes = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const signInData = (await signInRes.json().catch(() => ({}))) as {
        error?: string;
        idToken?: string;
      };
      if (!signInRes.ok || !signInData.idToken) {
        pendingToken.current = "";
        setError(signInData.error || "Sign-in failed. Please try again.");
        return;
      }

      // 2FA step 1 — email + password passed on the server; ask the server
      // to email a one-time code. The session is stored only after step 2.
      const idToken = signInData.idToken;
      pendingToken.current = idToken;
      const otpRes = await fetch("/api/admin/otp/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const otpData = (await otpRes.json().catch(() => ({}))) as {
        error?: string;
        devNotice?: string;
        messageId?: string | null;
        delivery?: OtpSendOutcome;
      };

      if (!otpRes.ok) {
        pendingToken.current = "";
        setError(otpData.error || "Could not send the verification code.");
        return;
      }

      setOtpCode("");
      setStage("otp");
      setNotice(
        otpData.devNotice ||
          (otpData.delivery === "SUCCESS"
            ? `A 6-digit sign-in code was emailed to ${email.trim()} and expires in 5 minutes. Check the spam folder if it is not in the inbox.`
            : `A 6-digit sign-in code was generated for ${email.trim()}, but email delivery could not be confirmed. It expires in 5 minutes.`)
      );
      setCooldown(60);
    } catch {
      pendingToken.current = "";
      setError("Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setNotice("");
    setIsLoading(true);
    try {
      const freshToken = pendingToken.current;
      if (!freshToken) {
        setStage("form");
        return;
      }
      const res = await fetch("/api/admin/otp/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${freshToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        devNotice?: string;
        messageId?: string | null;
        delivery?: OtpSendOutcome;
      };
      if (!res.ok) {
        setError(data.error || "Could not resend the code. Sign in again to retry.");
        return;
      }
      setNotice(
        data.devNotice ||
          (data.delivery === "SUCCESS"
            ? `A new 6-digit code was emailed to ${email} and expires in 5 minutes.`
            : `A new 6-digit code was generated for ${email}, but email delivery could not be confirmed. It expires in 5 minutes.`)
      );
      setCooldown(60);
    } catch {
      setError("Could not resend the code. Sign in again to retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const freshToken = pendingToken.current;
    if (!freshToken) {
      setStage("form");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/otp/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${freshToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: otpCode.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }
      await finishSignIn(freshToken);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email above first, then click Forgot password.");
      return;
    }
    try {
      const res = await fetch("/api/admin/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not send a reset email. Please try again.");
        return;
      }
      setNotice(
        data.message ||
          "If that email is registered, a password reset link has been sent."
      );
    } catch {
      setError("Could not send a reset email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyberwolf opacity-30 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <Image
              src="/cw.jpeg"
              alt="Cyber Wolf Logo"
              width={56}
              height={56}
              className="w-full h-full object-contain rounded-full"
              priority
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF0007]">
              ADMIN PORTAL
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-1">
              CYBER WOLF ADMIN
            </h1>
            <p className="text-xs text-white/60 font-mono mt-1">
              WOLF IDEA PITCH 2026 • Security Area
            </p>
          </div>
        </div>

        <Card variant="default" className="border-white/15 p-6 sm:p-8 bg-[#0F0F0F] rounded-none">
          {stage === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 flex items-center justify-center border border-[#FF0007]/40 bg-[#FF0007]/10">
                  <MailCheck className="w-6 h-6 text-[#FF0007]" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                    Two-factor verification
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed font-mono">
                    {notice || `Enter the 6-digit code emailed to ${email}.`}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#FF0007]/10 border border-[#FF0007]/30 text-xs text-[#FF0007] flex items-start gap-2 font-medium text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-otp"
                  className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 text-center"
                >
                  Verification code
                </label>
                <input
                  id="admin-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  autoFocus
                  className="w-full h-14 bg-[#0A0A0A] border border-white/15 rounded-none px-4 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder:text-white/25 focus:outline-none focus:border-[#FF0007]/60 focus:ring-1 focus:ring-[#FF0007]/30 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                style={{ backgroundColor: "#FF0007" }}
                className="w-full inline-flex h-11 items-center justify-center gap-2.5 rounded-none px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <span>{isLoading ? "Verifying..." : "Verify code"}</span>
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading || cooldown > 0}
                className="w-full inline-flex h-11 items-center justify-center gap-2 border border-white/20 rounded-none px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-[#FF0007]/60 hover:text-[#FF0007] disabled:opacity-40"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>
                  {cooldown > 0
                    ? `Resend available in ${cooldown}s`
                    : "Resend code"}
                </span>
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    pendingToken.current = "";
                    setOtpCode("");
                    setStage("form");
                    setError("");
                    setNotice("");
                  }}
                  className="text-[11px] font-mono text-white/50 underline underline-offset-4 hover:text-white transition"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-5">
              <p className="text-xs text-white/60 leading-relaxed text-center">
                Access is restricted to the organizer account.
                <br />
                Sign in with the authorized organizer email.
              </p>

              {error && (
                <div className="p-3 bg-[#FF0007]/10 border border-[#FF0007]/30 text-xs text-[#FF0007] flex items-start gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {notice && (
                <div className="p-3 border border-white/20 bg-white/5 text-xs text-white/80 flex items-start gap-2">
                  <MailCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#FF0007]" />
                  <span>{notice}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="organizer@example.com"
                  className="w-full h-11 bg-[#0A0A0A] border border-white/15 rounded-none px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF0007]/60 focus:ring-1 focus:ring-[#FF0007]/30 transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-mono text-white/40 hover:text-[#FF0007] transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 bg-[#0A0A0A] border border-white/15 rounded-none px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF0007]/60 focus:ring-1 focus:ring-[#FF0007]/30 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{ backgroundColor: "#FF0007" }}
                className="w-full inline-flex h-11 items-center justify-center gap-2.5 rounded-none px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <span>{isLoading ? "Verifying..." : "Sign in securely"}</span>
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
