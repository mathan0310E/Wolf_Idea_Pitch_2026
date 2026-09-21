"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Lock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Firebase Auth is the ONLY credential path — no hardcoded fallback.
      // The signed-in user must carry the `role: "admin"` custom claim;
      // every /api/admin/* route re-verifies it server-side (see lib/admin-auth.ts).
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await cred.user.getIdTokenResult();
      if ((res.claims as { role?: string }).role !== "admin") {
        setError(
          "This account is not an admin. Ask the organizer to grant the admin role (see FIREBASE_SETUP.md)."
        );
        return;
      }
      sessionStorage.setItem("wolf_admin_session", idToken);
      router.push("/admin/dashboard");
    } catch {
      setError("Invalid admin credentials or permission denied.");
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
              WOLF IDEATHON 2026 • Security Area
            </p>
          </div>
        </div>

        <Card variant="default" className="border-white/15 p-6 sm:p-8 bg-[#0F0F0F] rounded-none">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Admin Email"
              type="email"
              required
              placeholder="admin@cyberwolf.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="p-3 bg-[#FF0007]/10 border border-[#FF0007]/30 text-xs text-[#FF0007] flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: "#FF0007" }}
              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-none px-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? "Authenticating..." : "Sign In to Dashboard"}</span>
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
