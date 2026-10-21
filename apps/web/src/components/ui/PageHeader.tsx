import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Back link or breadcrumb rendered above the title */
  backSlot?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backSlot,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 pb-4 border-b border-line lg:flex-row lg:items-start lg:justify-between lg:gap-4",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {backSlot && <div className="mb-2">{backSlot}</div>}
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink-900 truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-500 max-w-prose">{description}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center">{action}</div>
      )}
    </div>
  );
}

export default PageHeader;
