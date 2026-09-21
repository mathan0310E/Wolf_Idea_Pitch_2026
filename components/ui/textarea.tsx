import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium uppercase tracking-wider text-zinc-300"
          >
            {label}
            {props.required && <span className="text-[#E50914] ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg bg-[#1E1E1E] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 border border-white/10 transition-colors focus:border-[#E50914] focus:outline-none focus:ring-1 focus:ring-[#E50914] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#E50914] focus:ring-[#E50914]",
            className
          )}
          ref={ref}
          {...props}
        />
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
Textarea.displayName = "Textarea";

export { Textarea };
