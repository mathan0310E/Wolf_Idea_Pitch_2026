import * as React from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RegistrationStatus, PaymentStatus } from "@/lib/types";

interface StatusChipProps {
  status: RegistrationStatus | PaymentStatus | string;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const normalized = status.toUpperCase();

  let icon = <Clock className="w-3.5 h-3.5" />;
  let label = status;
  let bgClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";

  if (normalized === "CONFIRMED" || normalized === "VERIFIED") {
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    label = normalized === "CONFIRMED" ? "✓ Confirmed" : "✓ Verified";
    bgClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (normalized === "REJECTED" || normalized === "CANCELLED") {
    icon = <XCircle className="w-3.5 h-3.5" />;
    label = normalized === "REJECTED" ? "✕ Rejected" : "✕ Cancelled";
    bgClass = "bg-[#E50914]/10 text-[#E50914] border-[#E50914]/20";
  } else if (normalized === "SUBMITTED" || normalized === "PAYMENT_VERIFICATION" || normalized === "PAYMENT_PENDING") {
    icon = <Clock className="w-3.5 h-3.5" />;
    label = "⏳ Pending Verification";
    bgClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (normalized === "DRAFT") {
    icon = <AlertCircle className="w-3.5 h-3.5" />;
    label = "Draft";
    bgClass = "bg-zinc-800 text-zinc-400 border-zinc-700";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        bgClass,
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
