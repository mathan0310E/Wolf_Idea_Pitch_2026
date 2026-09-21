"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { Search, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Registration } from "@/lib/types";

function StatusForm() {
  const searchParams = useSearchParams();
  const [registrationId, setRegistrationId] = React.useState("");
  const [lookupToken, setLookupToken] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<Registration | null>(null);

  const fetchStatus = React.useCallback(async (id: string, token: string) => {
    setIsSearching(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/registrations/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: id, lookupToken: token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration record not found or invalid token.");
      }

      setResult(data.registration);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching registration status.";
      setError(msg);
        } finally {
      setIsSearching(false);
        }
  }, []);

  const autoLookupDone = React.useRef(false);
  React.useEffect(() => {
    if (autoLookupDone.current) return;
    const params = new URLSearchParams(searchParams);
    const idParam = params.get("id");
    const tokenParam = params.get("token");
    if (idParam && tokenParam) {
      autoLookupDone.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial URL param hydration only
      void fetchStatus(idParam, tokenParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim() || !lookupToken.trim()) {
      setError("Please provide both Registration ID and Lookup Token.");
      return;
    }
    fetchStatus(registrationId, lookupToken);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1E1E1E] text-xs font-mono text-[#E50914] border border-white/10">
          SECURE LOOKUP
        </div>
        <h1 className="font-display text-4xl font-extrabold text-white">
          REGISTRATION <span className="text-[#E50914]">STATUS TRACKER</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Enter your Registration ID and secret Lookup Token to check your verification progress.
        </p>
      </div>

      <Card variant="default" className="border-white/10 p-6 sm:p-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <Input
            label="Registration ID"
            required
            placeholder="e.g. WOLF-2026-00001"
            value={registrationId}
            onChange={(e) => setRegistrationId(e.target.value)}
          />

          <Input
            label="Private Lookup Token"
            required
            type="password"
            placeholder="Enter secret lookup token"
            value={lookupToken}
            onChange={(e) => setLookupToken(e.target.value)}
          />

          {error && (
            <div className="p-3 rounded-lg bg-[#E50914]/10 border border-[#E50914]/30 text-xs text-[#E50914] flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-[#E50914]/20 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? "Searching Records..." : "Check Registration Status"}</span>
          </button>
        </form>
      </Card>

      {result && (
        <Card variant="default" className="border-white/10 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-xs font-mono text-zinc-400 block">Registration ID</span>
              <h3 className="font-mono text-2xl font-bold text-[#E50914]">{result.registrationId}</h3>
              <span className="text-xs text-zinc-400 font-mono">Team: {result.teamName} ({result.teamType.toUpperCase()})</span>
            </div>
            <StatusChip status={result.paymentStatus} className="text-sm px-4 py-1.5" />
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Verification Lifecycle Progress
            </h4>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#1E1E1E] border border-white/10 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <h5 className="font-bold text-sm text-white">Registration & Details Submitted</h5>
                  <p className="text-xs text-zinc-400">Team forms and member data received.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1E1E1E] border border-white/10 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <h5 className="font-bold text-sm text-white">Payment Proof Received</h5>
                  <p className="text-xs text-zinc-400">UTR: {result.utr || "Submitted"} | Txn ID: {result.transactionId || "Submitted"}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1E1E1E] border border-white/10 flex items-center gap-3">
                {result.paymentStatus === "VERIFIED" || result.paymentStatus === "CONFIRMED" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : result.paymentStatus === "REJECTED" ? (
                  <XCircle className="w-5 h-5 text-[#E50914] flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <h5 className="font-bold text-sm text-white">CyberWolf Admin Verification</h5>
                  <p className="text-xs text-zinc-400">
                    {result.paymentStatus === "VERIFIED" || result.paymentStatus === "CONFIRMED"
                      ? "Verified by CyberWolf verification desk."
                      : result.paymentStatus === "REJECTED"
                      ? `Rejected: ${result.rejectionReason || "Invalid payment proof"}`
                      : "Verification currently pending review by CyberWolf team."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Registered Members ({result.members.length})
            </h4>
            <div className="space-y-2">
              {result.members.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#151515] border border-white/10 text-xs flex justify-between">
                  <span className="font-bold text-white">{m.name} {idx === 0 && "(Leader)"}</span>
                  <span className="text-zinc-400">{m.college} • {m.department}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function StatusPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex-1 py-16">
        <React.Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading status tracker...</div>}>
          <StatusForm />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
