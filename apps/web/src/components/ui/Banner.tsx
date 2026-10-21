import * as React from "react";
import { CheckCircle2, Info, TriangleAlert, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";

export type BannerVariant = "ok" | "warn" | "info" | "danger";

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant;
  /** 1 kalimat maks */
  message: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ElementType;
  onDismiss?: () => void;
}

const variantConfig: Record<
  BannerVariant,
  {
    containerClass: string;
    iconClass: string;
    DefaultIcon: React.ElementType;
  }
> = {
  ok: {
    containerClass: "bg-ok-100 text-ok-700 border-ok-700/20",
    iconClass: "text-ok-700",
    DefaultIcon: CheckCircle2,
  },
  warn: {
    containerClass: "bg-warn-100 text-warn-700 border-warn-700/20",
    iconClass: "text-warn-700",
    DefaultIcon: WifiOff,
  },
  info: {
    containerClass: "bg-info-100 text-info-700 border-info-700/20",
    iconClass: "text-info-700",
    DefaultIcon: Wifi,
  },
  danger: {
    containerClass: "bg-danger-100 text-danger-700 border-danger-700/20",
    iconClass: "text-danger-700",
    DefaultIcon: TriangleAlert,
  },
};

const fallbackIcons: Partial<Record<BannerVariant, React.ElementType>> = {
  ok: CheckCircle2,
  warn: WifiOff,
  info: Info,
  danger: TriangleAlert,
};

export function Banner({
  variant = "info",
  message,
  action,
  icon,
  onDismiss,
  className,
  ...props
}: BannerProps) {
  const cfg = variantConfig[variant];
  const Icon = icon ?? fallbackIcons[variant] ?? Info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        cfg.containerClass,
        className
      )}
      {...props}
    >
      <Icon className={cn("size-5 shrink-0", cfg.iconClass)} aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className={cn(
            "shrink-0 rounded p-0.5 transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety-500",
            "hover:opacity-70"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Banner;
