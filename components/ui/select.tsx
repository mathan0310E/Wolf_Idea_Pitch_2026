import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, children, options, ...props }, ref) => {
    const selectId = id || React.useId();
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium uppercase tracking-wider text-zinc-300"
          >
            {label}
            {props.required && <span className="text-[#E50914] ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-11 w-full rounded-lg bg-[#1E1E1E] px-3.5 py-2 text-sm text-white border border-white/10 transition-colors focus:border-[#E50914] focus:outline-none focus:ring-1 focus:ring-[#E50914] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#E50914] focus:ring-[#E50914]",
            className
          )}
          ref={ref}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#151515] text-white">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="text-xs text-[#E50914] flex items-center gap-1 font-medium">
            <span>⚠</span> {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
