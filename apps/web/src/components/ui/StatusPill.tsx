import * as React from "react";
import { cn } from "@/lib/cn";
import {
  ShieldCheck,
  Hourglass,
  Clock,
  RotateCcw,
  TriangleAlert,
  Circle,
  LucideIcon,
} from "lucide-react";

export type StatusVariant =
  | "ok"
  | "warn"
  | "danger"
  | "info"
  | "neutral";

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  icon?: LucideIcon;
  statusKey?:
    | "queued"
    | "synced"
    | "PENDING_VERIFICATION"
    | "VERIFIED"
    | "REVISION_REQUIRED"
    | "DRIFT_WARNING"
    | "NOT_STARTED";

}

const statusMapping: Record<
  string,
  { label: string; variant: StatusVariant; icon: LucideIcon }
> = {
  queued: { label: "Belum terkirim", variant: "warn", icon: Clock },
  synced: { label: "Menunggu mentor", variant: "warn", icon: Hourglass },
  PENDING_VERIFICATION: {
    label: "Menunggu mentor",
    variant: "warn",
    icon: Hourglass,
  },
  VERIFIED: { label: "Terverifikasi", variant: "ok", icon: ShieldCheck },
  REVISION_REQUIRED: {
    label: "Perlu diperbaiki",
    variant: "danger",
    icon: RotateCcw,
  },
  DRIFT_WARNING: {
    label: "Perlu perhatian",
    variant: "danger",
    icon: TriangleAlert,
  },
  NOT_STARTED: { label: "Belum mulai", variant: "neutral", icon: Circle },
};

const variantClasses: Record<StatusVariant, string> = {
  ok: "bg-ok-100 text-ok-700",
  warn: "bg-warn-100 text-warn-700",
  danger: "bg-danger-100 text-danger-700",
  info: "bg-info-100 text-info-700",
  neutral: "bg-ink-100 text-ink-700",
};

export function StatusPill({
  variant,
  icon,
  statusKey,
  children,
  className,
  ...props
}: StatusPillProps) {
  let activeVariant = variant ?? "neutral";
  let ActiveIcon = icon;
  let label = children;

  if (statusKey && statusMapping[statusKey]) {
    const config = statusMapping[statusKey];
    activeVariant = variant ?? config.variant;
    ActiveIcon = icon ?? config.icon;
    if (!label) {
      label = config.label;
    }
  }

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap",
        variantClasses[activeVariant],
        className
      )}
      {...props}
    >
      {ActiveIcon && <ActiveIcon className="size-3.5 shrink-0 stroke-[2]" />}
      <span>{label}</span>
    </span>
  );
}
