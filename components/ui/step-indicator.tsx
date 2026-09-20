import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto pb-2 scrollbar-none">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3 min-w-max">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 border",
                    isCompleted &&
                      "bg-[#E50914] text-white border-[#E50914]",
                    isCurrent &&
                      "bg-white text-black border-white ring-4 ring-[#E50914]/20",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-[#1E1E1E] text-zinc-400 border-white/10"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-wider uppercase",
                      isCurrent && "text-[#E50914]",
                      isCompleted && "text-white",
                      !isCurrent && !isCompleted && "text-zinc-400"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] mx-3 min-w-[20px] transition-colors duration-200",
                    currentStep > step.id ? "bg-[#E50914]" : "bg-white/10"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
