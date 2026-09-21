"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminHeader } from "@/components/admin-header";
import { Registration } from "@/lib/types";

function adminToken(): string | null {
  try {
    return sessionStorage.getItem("wolf_admin_session");
  } catch {
    return null;
  }
}

export default function AdminPaymentsQueuePage() {
  const router = useRouter();
  const [pending, setPending] = React.useState<Registration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const token = adminToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          "/api/admin/registrations?status=SUBMITTED&limit=100",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem("wolf_admin_session");
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok) setPending(data.registrations || []);
      } catch {
        // Queue shows a fallback card on fetch failure
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <AdminHeader title="PAYMENT VERIFICATION QUEUE" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">UPI Payment Verification Queue</h1>
          <p className="text-xs text-zinc-400">Review pending UTR and payment screenshot proofs</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Card variant="default" className="border-white/10 p-8 text-center space-y-3">
            <Clock className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="font-display text-lg font-bold text-white">Queue Clear — 0 Pending Verification</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              All submitted payment proofs have been reviewed. New submissions will appear here automatically.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <Card variant="default" className="border-white/10 p-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Queue Status: {pending.length} Pending Verification
                </h3>
                <p className="text-xs text-zinc-400">
                  Oldest first — open each record in the master table to approve or reject proof.
                </p>
              </div>
              <Link href="/admin/registrations"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] text-white font-bold text-xs uppercase"
              >
                Go to Registrations Master Table
              </Link>
            </Card>

            {pending.map((r) => (
              <Card key={r.registrationId} variant="default" className="border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div className="text-xs">
                  <span className="font-mono font-bold text-[#E50914]">{r.registrationId}</span>
                  <span className="text-white font-bold"> · {r.teamName}</span>
                  <span className="text-zinc-400 font-mono"> · UTR {r.utr || "—"}</span>
                </div>
                <Link href="/admin/registrations"
                  className="text-xs font-bold text-[#E50914] hover:underline"
                >
                  Inspect →
                </Link>
              </Card>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
