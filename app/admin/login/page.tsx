"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AlertCircle, FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/card";

const IS_DEV = process.env.NODE_ENV === "development";

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#ffffff"
        d="M21.35 11.1h-9.17v2.96h5.28c-.23 1.36-1.66 4-5.28 4-3.18 0-5.77-2.63-5.77-5.88s2.59-5.88 5.77-5.88c1.8 0 3 .77 3.7 1.43l2.52-2.43C16.75 3.7 14.78 2.8 12.18 2.8 7.13 2.8 3.04 6.88 3.04 12.18s4.09 9.38 9.14 9.38c5.28 0 8.78-3.71 8.78-8.94 0-.6-.06-1.04-.15-1.52z"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleDevSignIn = () => {
    // Dev-only bypass: with no FIREBASE_ADMIN_* env vars configured, the
    // server runs in mock mode (lib/firebase-admin.ts) and accepts any
    // Bearer token as role "admin". This button is stripped from production
    // builds because IS_DEV is inlined at build time.
    sessionStorage.setItem("wolf_admin_session", "dev-mock-admin-token");
    router.push("/admin/dashboard");
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();

      // Server-side gate: requireAdmin() in lib/admin-auth.ts enforces the
      // ADMIN_EMAILS allowlist for every /api/admin/* route. The session is
      // only stored after the server confirms this account is authorized.
      const res = await fetch("/api/admin/session", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        await signOut(auth); // not an admin — drop the Firebase session
        setError(data.error || "This Google account is not authorized for admin access.");
        return;
      }

      sessionStorage.setItem("wolf_admin_session", idToken);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("Sign-in window was closed before finishing.");
      } else if (code === "auth/popup-blocked") {
        setError("Your browser blocked the sign-in popup. Allow popups and try again.");
      } else if (code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains."
        );
      } else {
        setError("Google sign-in failed. Enable the Google provider in Firebase Console and try again.");
      }
    } finally {
      setIsLoading(false);
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
          <div className="space-y-5">
            <p className="text-xs text-white/60 leading-relaxed text-center">
              Access is restricted to the organizer account.
              <br />
              Sign in with the authorized Google email only.
            </p>

            {error && (
              <div className="p-3 bg-[#FF0007]/10 border border-[#FF0007]/30 text-xs text-[#FF0007] flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{ backgroundColor: "#FF0007" }}
              className="w-full inline-flex h-11 items-center justify-center gap-2.5 rounded-none px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <GoogleG />
              <span>{isLoading ? "Authenticating..." : "Sign in with Google"}</span>
            </button>
          </div>
        </Card>

        {IS_DEV && (
          <div className="rounded-none border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-center space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Dev Only — No Firebase Required
            </p>
            <button
              type="button"
              onClick={handleDevSignIn}
              className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-none border border-amber-500/50 px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400 transition hover:bg-amber-500/10"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Dev Sign-In (Mock Admin)</span>
            </button>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Skips auth and uses the in-memory mock store (data resets on server
              restart). Hidden in production builds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
