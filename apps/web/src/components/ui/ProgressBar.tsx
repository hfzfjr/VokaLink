import * as React from "react";
import { cn } from "@/lib/cn";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100 */
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "default";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = false,
  size = "default",
  className,
  ...props
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-ink-500">{label}</span>
          )}
          {showLabel && (
            <span className="text-xs font-medium tabular-nums text-ink-700">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "Progres"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-ink-100",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className="h-full rounded-full bg-ink-900 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
