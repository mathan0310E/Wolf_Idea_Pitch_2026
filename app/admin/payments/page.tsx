"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, FileCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { AdminHeader } from "@/components/admin-header";
import { formatINR } from "@/config/event";

export default function AdminPaymentsQueuePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <AdminHeader title="PAYMENT VERIFICATION QUEUE" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">UPI Payment Verification Queue</h1>
          <p className="text-xs text-zinc-400">Review pending UTR and payment screenshot proofs</p>
        </div>

        <Card variant="default" className="border-white/10 p-8 text-center space-y-3">
          <Clock className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-display text-lg font-bold text-white">Queue Status: 1 Pending Verification</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Use the Registrations Master table to inspect individual team details and approve or reject proof.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/registrations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] text-white font-bold text-xs uppercase"
            >
              Go to Registrations Master Table
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
