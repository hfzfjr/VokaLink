import * as React from "react";
import { cn } from "@/lib/cn";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label: string;
  helper?: string;
}

export function Stat({
  value,
  label,
  helper,
  className,
  ...props
}: StatProps) {
  return (
    <div className={cn("space-y-0.5", className)} {...props}>
      <div className="text-3xl font-bold tabular-nums text-ink-900 leading-tight">
        {value}
      </div>
      <div className="text-xs font-medium text-ink-500">{label}</div>
      {helper && <div className="text-xs text-ink-500 mt-1">{helper}</div>}
    </div>
  );
}
