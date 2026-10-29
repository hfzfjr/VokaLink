import * as React from "react";
import { cn } from "@/lib/cn";

// ─── Base class ─────────────────────────────────────────────────────────────────
// Standar Animasi Shimmer Streaming (Apple / Stripe style) per DESIGN.md 13.9
const BASE = "skeleton-shimmer animate-pulse bg-slate-200/70";

// ─── Primitives ─────────────────────────────────────────────────────────────────

export function SkeletonText({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${BASE} h-4 rounded-md w-full`, className)} {...props} />
  );
}

export function SkeletonTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${BASE} h-6 rounded-md w-3/5`, className)} {...props} />
  );
}

export function SkeletonRect({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${BASE} rounded-md`, className)} {...props}>
      {children}
    </div>
  );
}

export function SkeletonRounded({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${BASE} rounded-xl h-40 w-full`, className)} {...props}>
      {children}
    </div>
  );
}

export function SkeletonCircle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${BASE} rounded-full w-10 h-10 shrink-0`, className)} {...props} />
  );
}

/** Avatar alias */
export function SkeletonAvatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <SkeletonCircle className={cn("w-10 h-10", className)} {...props} />;
}

export function SkeletonButton({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(`${BASE} h-12 rounded-lg w-28`, className)} {...props}>
      {children}
    </div>
  );
}

// ─── Composites ─────────────────────────────────────────────────────────────────

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white p-4 lg:p-5 space-y-3",
        className
      )}
    >
      <SkeletonTitle />
      <SkeletonText className="w-2/3" />
      <SkeletonText className="w-full" />
      <SkeletonButton className="w-32" />
    </div>
  );
}

export function SkeletonListRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <SkeletonCircle />
      <div className="flex-1 space-y-1.5">
        <SkeletonText className="w-2/5" />
        <SkeletonText className="w-1/4" />
      </div>
    </div>
  );
}

export function SkeletonStatStrip({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonText className="h-8 w-3/4" />
          <SkeletonText className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton all-in-one ────────────────────────────────────────────────────────

export type SkeletonVariant =
  | "text"
  | "title"
  | "rect"
  | "rounded"
  | "circle"
  | "avatar"
  | "button"
  | "card"
  | "list-row"
  | "stat-strip";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** CSS width value, e.g. "60%" or "120px" — untuk backward compat */
  width?: string;
  /** CSS height value, e.g. "28px" — untuk backward compat */
  height?: string;
  className?: string;
}

/**
 * Komponen Skeleton all-in-one (satu-satunya tempat animate-pulse).
 *
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="card" />
 * <Skeleton variant="avatar" />
 */
export function Skeleton({ variant = "text", width, height, className }: SkeletonProps) {
  const wrapStyle: React.CSSProperties | undefined =
    width || height ? { width, height } : undefined;

  // If width/height given, we need a wrapper to apply the style
  const wrap = (el: React.ReactNode) =>
    wrapStyle ? <div style={wrapStyle}>{el}</div> : <>{el}</>;

  switch (variant) {
    case "title":
      return wrap(<SkeletonTitle className={className} />);
    case "rect":
      return wrap(<SkeletonRect className={className} />);
    case "rounded":
      return wrap(<SkeletonRounded className={className} />);
    case "circle":
      return wrap(<SkeletonCircle className={className} />);
    case "avatar":
      return wrap(<SkeletonAvatar className={className} />);
    case "button":
      return wrap(<SkeletonButton className={className} />);
    case "card":
      return <SkeletonCard className={className} />;
    case "list-row":
      return <SkeletonListRow className={className} />;
    case "stat-strip":
      return <SkeletonStatStrip className={className} />;
    default:
      return wrap(<SkeletonText className={className} />);
  }
}

export default Skeleton;
