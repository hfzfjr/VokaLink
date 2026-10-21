"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DisclosureProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
}

export function Disclosure({
  trigger,
  children,
  defaultOpen = false,
  className,
  triggerClassName,
  panelClassName,
}: DisclosureProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const panelId = React.useId();

  return (
    <div className={cn("border-t border-line", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 py-3 text-sm font-medium text-ink-700 text-left",
          "hover:text-ink-900 transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety-500 focus-visible:ring-offset-2 rounded",
          triggerClassName
        )}
      >
        <span>{trigger}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink-500 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={cn(
          "pb-4 text-sm text-ink-700 leading-relaxed",
          panelClassName
        )}
      >
        {open && children}
      </div>
    </div>
  );
}

export default Disclosure;
