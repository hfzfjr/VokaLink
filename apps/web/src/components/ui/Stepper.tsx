import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number; // 1-indexed
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  const total = steps.length;

  return (
    <nav
      aria-label="Langkah-langkah"
      className={cn("w-full", className)}
    >
      {/* Mobile: text indicator */}
      <div className="sm:hidden mb-4">
        <p className="text-xs font-medium text-ink-500">
          Langkah {currentStep} dari {total}
        </p>
        <p className="text-sm font-semibold text-ink-900">
          {steps[currentStep - 1]?.label}
        </p>
      </div>

      {/* Desktop: step bar */}
      <ol
        className="hidden sm:flex items-center gap-0 w-full"
        aria-label="Langkah-langkah"
      >
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <React.Fragment key={stepNum}>
              <li
                className="flex flex-col items-center gap-1.5 shrink-0"
                aria-current={isActive ? "step" : undefined}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-150",
                    isDone &&
                      "border-ink-900 bg-ink-900 text-white",
                    isActive &&
                      "border-safety-500 bg-safety-500 text-ink-900",
                    isUpcoming &&
                      "border-ink-200 bg-white text-ink-400"
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium text-center max-w-[6rem] leading-tight",
                    isActive ? "text-ink-900" : "text-ink-500"
                  )}
                >
                  {step.label}
                </span>
              </li>

              {/* Connector */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 rounded-full mb-4",
                    isDone ? "bg-ink-900" : "bg-ink-200"
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>

      {/* Mobile: progress bar strip */}
      <div className="sm:hidden h-1 w-full rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-safety-500 transition-[width] duration-300"
          style={{ width: `${((currentStep - 1) / (total - 1)) * 100}%` }}
        />
      </div>
    </nav>
  );
}

export default Stepper;
