"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  DollarSign,
  CheckCircle2,
  FileText,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { AdminHeader } from "@/components/admin-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR, teamTypeLabel } from "@/config/event";
import { Registration } from "@/lib/types";

function adminToken(): string | null {
  try {
    return sessionStorage.getItem("wolf_admin_session");
  } catch {
    return null;
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = React.useState<Registration[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const token = adminToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/admin/registrations?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem("wolf_admin_session");
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load dashboard.");
        setRegistrations(data.registrations || []);
        setTotal(data.total ?? (data.registrations || []).length);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  const handleExport = async () => {
    const token = adminToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    const res = await fetch("/api/admin/export", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      alert("Export failed. Please sign in again if your session expired.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wolf_ideathon_registrations_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRegs = total;
  const totalParticipants = registrations.reduce((acc, r) => acc + r.memberCount, 0);
  const totalRevenue = registrations.reduce((acc, r) => acc + r.totalAmount, 0);
  const verifiedCount = registrations.filter((r) => r.paymentStatus === "VERIFIED" || r.paymentStatus === "CONFIRMED").length;
  const pendingCount = registrations.filter((r) => r.paymentStatus === "SUBMITTED" || r.paymentStatus === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <AdminHeader title="WOLF ADMIN DASHBOARD" />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:p-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white">Overview & Registration Analytics</h1>
            <p className="text-xs text-zinc-400">Live feed from the registrations master table</p>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-[#E50914]/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV (Sanitized)</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 text-xs text-[#E50914] font-medium">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} variant="default" className="border-white/10">
                <CardContent>
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-bold uppercase text-zinc-400">Total Teams</CardDescription>
              <FileText className="w-5 h-5 text-[#E50914]" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-extrabold text-white">{totalRegs}</div>
            </CardContent>
          </Card>

          <Card variant="hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-bold uppercase text-zinc-400">Total Participants</CardDescription>
              <Users className="w-5 h-5 text-[#E50914]" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-extrabold text-white">{totalParticipants}</div>
            </CardContent>
          </Card>

          <Card variant="hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-bold uppercase text-zinc-400">Expected Revenue</CardDescription>
              <DollarSign className="w-5 h-5 text-[#E50914]" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-extrabold text-[#E50914]">{formatINR(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card variant="hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-bold uppercase text-zinc-400">Verified / Pending</CardDescription>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-extrabold text-white">
                <span className="text-emerald-400">{verifiedCount}</span> / <span className="text-amber-400">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white">Recent Registrations</h2>
            <Link href="/admin/registrations" className="text-xs text-[#E50914] hover:underline font-bold">
              View All Registrations →
            </Link>
          </div>

          <Card variant="default" className="border-white/10 p-0 overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <EmptyState
                title="No registrations found."
                description="New team submissions will appear here as soon as the registration gate opens."
              />
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1E1E1E] text-zinc-400 font-mono uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">Reg ID</th>
                    <th className="p-4">Team Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Submitted</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {registrations.map((reg) => (
                    <tr key={reg.registrationId} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#E50914]">{reg.registrationId}</td>
                      <td className="p-4 font-bold text-white">{reg.teamName}</td>
                      <td className="p-4 uppercase">{teamTypeLabel(reg.teamType)} ({reg.memberCount})</td>
                      <td className="p-4 font-mono">{formatINR(reg.totalAmount)}</td>
                      <td className="p-4"><StatusChip status={reg.paymentStatus} /></td>
                      <td className="p-4 text-zinc-400">{reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="p-4">
                        <Link
                          href={`/admin/registrations`}
                          className="px-3 py-1 rounded bg-[#1E1E1E] hover:bg-white/10 text-white font-medium border border-white/10"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
