import * as React from "react";
import { FolderX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No data found",
  description = "There are no records to display at this time.",
  action,
  icon = <FolderX className="w-10 h-10 text-zinc-500" />,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-xl border border-white/10 bg-[#151515]",
        className
      )}
    >
      <div className="p-4 rounded-full bg-[#1E1E1E] border border-white/10 mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
