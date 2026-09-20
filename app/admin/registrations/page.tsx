"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { AdminHeader } from "@/components/admin-header";
import { formatINR, teamTypeLabel } from "@/config/event";
import { Registration } from "@/lib/types";

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [typeFilter, setTypeFilter] = React.useState("ALL");
  const [selectedReg, setSelectedReg] = React.useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [registrations, setRegistrations] = React.useState<Registration[]>([
    {
      registrationId: "WOLF-2026-00001",
      lookupToken: "sampletoken1234567890abcdef",
      teamName: "CyberSec Alpha",
      teamType: "square",
      memberCount: 4,
      domain: "[THEME 1]",
      totalAmount: 1200,
      registrationStatus: "CONFIRMED",
      paymentStatus: "VERIFIED",
      transactionId: "TXN1001",
      utr: "UTR98765432101",
      screenshotUrl: "",
      members: [
        {
          name: "Alex Vance",
          email: "alex@example.com",
          phone: "9876543210",
          college: "Tech Institute",
          department: "CSE",
          year: "3",
          registerNumber: "21CS001",
          isTeamLeader: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      registrationId: "WOLF-2026-00002",
      lookupToken: "sampletoken9876543210fedcba",
      teamName: "Solo Hacker",
      teamType: "individual",
      memberCount: 1,
      domain: "[THEME 2]",
      totalAmount: 300,
      registrationStatus: "SUBMITTED",
      paymentStatus: "SUBMITTED",
      transactionId: "TXN1002",
      utr: "UTR98765432102",
      screenshotUrl: "",
      members: [
        {
          name: "Sarah Lin",
          email: "sarah@example.com",
          phone: "9876543211",
          college: "Cyber College",
          department: "IT",
          year: "2",
          registerNumber: "22IT045",
          isTeamLeader: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  React.useEffect(() => {
    const session = sessionStorage.getItem("wolf_admin_session");
    if (!session) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleVerify = async (regId: string, status: "VERIFIED" | "REJECTED") => {
    if (status === "REJECTED" && !rejectReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: regId,
          status,
          rejectionReason: status === "REJECTED" ? rejectReason : undefined,
        }),
      });

      if (!res.ok) throw new Error("Verification update failed");

      setRegistrations((prev) =>
        prev.map((r) =>
          r.registrationId === regId
            ? {
                ...r,
                paymentStatus: status,
                registrationStatus: status === "REJECTED" ? "REJECTED" : "CONFIRMED",
                rejectionReason: status === "REJECTED" ? rejectReason : undefined,
              }
            : r
        )
      );

      setSelectedReg(null);
      setRejectReason("");
    } catch (err) {
      alert("Error updating status");
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = registrations.filter((r) => {
    const matchSearch =
      r.registrationId.toLowerCase().includes(search.toLowerCase()) ||
      r.teamName.toLowerCase().includes(search.toLowerCase()) ||
      r.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) ||
      (r.utr && r.utr.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "ALL" || r.paymentStatus === statusFilter;
    const matchType = typeFilter === "ALL" || r.teamType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <AdminHeader title="REGISTRATION MANAGEMENT" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white">Registrations Master List</h1>
            <p className="text-xs text-zinc-400">Search, filter, verify, and export all team records</p>
          </div>

          <a
            href="/api/admin/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Search Reg ID, Team, Name, Email, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "ALL", label: "All Payment Statuses" },
              { value: "SUBMITTED", label: "Pending Verification" },
              { value: "VERIFIED", label: "Verified" },
              { value: "REJECTED", label: "Rejected" },
            ]}
          />

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: "ALL", label: "All Categories" },
              { value: "individual", label: "Solo (1)" },
              { value: "duo", label: "Duo (2)" },
              { value: "square", label: "Squad (4)" },
            ]}
          />
        </div>

        {/* Table */}
        <Card variant="default" className="border-white/10 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1E1E1E] text-zinc-400 font-mono uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Reg ID</th>
                  <th className="p-4">Team Name</th>
                  <th className="p-4">Leader / Contact</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Fee</th>
                  <th className="p-4">UTR / Ref</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filtered.map((reg) => (
                  <tr key={reg.registrationId} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#E50914]">{reg.registrationId}</td>
                    <td className="p-4 font-bold text-white">{reg.teamName}</td>
                    <td className="p-4">
                      <div>{reg.members[0]?.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{reg.members[0]?.email}</div>
                    </td>
                    <td className="p-4 uppercase">{teamTypeLabel(reg.teamType)} ({reg.memberCount})</td>
                    <td className="p-4 font-mono">{formatINR(reg.totalAmount)}</td>
                    <td className="p-4 font-mono">{reg.utr || "N/A"}</td>
                    <td className="p-4"><StatusChip status={reg.paymentStatus} /></td>
                    <td className="p-4 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="px-2.5 py-1.5 rounded bg-[#1E1E1E] hover:bg-white/10 text-white font-medium border border-white/10 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Verification & Inspection Modal */}
        {selectedReg && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card variant="default" className="max-w-2xl w-full border-white/20 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Registration {selectedReg.registrationId}
                  </h3>
                  <span className="text-xs text-zinc-400 font-mono">Team: {selectedReg.teamName}</span>
                </div>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="text-zinc-400 hover:text-white p-1 text-sm font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-[#1E1E1E] p-4 rounded-xl">
                  <div>
                    <span className="text-zinc-400 block">Category:</span>
                    <span className="font-bold text-white uppercase">{teamTypeLabel(selectedReg.teamType)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Total Amount:</span>
                    <span className="font-bold text-[#E50914] font-mono">{formatINR(selectedReg.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Transaction ID:</span>
                    <span className="font-mono text-white">{selectedReg.transactionId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">UTR:</span>
                    <span className="font-mono text-white">{selectedReg.utr}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase">Members ({selectedReg.members.length})</h4>
                  {selectedReg.members.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#151515] border border-white/10 flex justify-between">
                      <div>
                        <span className="font-bold text-white">{m.name}</span> {i === 0 && "(Leader)"}
                        <div className="text-zinc-400">{m.college} • {m.department} ({m.registerNumber})</div>
                      </div>
                      <div className="text-right font-mono text-zinc-400">
                        <div>{m.email}</div>
                        <div>{m.phone}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <h4 className="font-bold text-white uppercase">Admin Decision</h4>
                  <Input
                    label="Rejection Reason (Required if rejecting)"
                    placeholder="e.g. Invalid UTR or unreadable screenshot"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleVerify(selectedReg.registrationId, "VERIFIED")}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Verify Payment</span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleVerify(selectedReg.registrationId, "REJECTED")}
                      className="flex-1 py-3 rounded-xl bg-[#E50914] hover:bg-[#C10712] text-white font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Submission</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
