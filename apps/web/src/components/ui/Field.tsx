import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

// ─── Label ────────────────────────────────────────────────────────────────────
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}
export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-medium text-ink-900 mb-1", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-danger-700" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-lg border bg-white px-3 text-base md:text-sm text-ink-900",
        "placeholder:text-ink-300 transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety-500 focus-visible:ring-offset-2",
        error
          ? "border-danger-700 focus-visible:ring-danger-700"
          : "border-ink-200 hover:border-ink-300",
        props.disabled && "cursor-not-allowed bg-ink-50 opacity-60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[88px] w-full rounded-lg border bg-white px-3 py-3 text-base md:text-sm text-ink-900 resize-y",
        "placeholder:text-ink-300 transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety-500 focus-visible:ring-offset-2",
        error
          ? "border-danger-700 focus-visible:ring-danger-700"
          : "border-ink-200 hover:border-ink-300",
        props.disabled && "cursor-not-allowed bg-ink-50 opacity-60",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ─── Select ───────────────────────────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-12 w-full rounded-lg border bg-white px-3 text-base md:text-sm text-ink-900 appearance-none",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safety-500 focus-visible:ring-offset-2",
        error
          ? "border-danger-700 focus-visible:ring-danger-700"
          : "border-ink-200 hover:border-ink-300",
        props.disabled && "cursor-not-allowed bg-ink-50 opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

// ─── FieldHint / FieldError ───────────────────────────────────────────────────
export function FieldHint({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-xs text-ink-500", className)} {...props}>
      {children}
    </p>
  );
}

export function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-xs font-medium text-danger-700",
        className
      )}
      role="alert"
      {...props}
    >
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// ─── Field (komposisi lengkap) ────────────────────────────────────────────────
export interface FieldProps {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Field({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <FieldHint>{hint}</FieldHint>
      ) : null}
    </div>
  );
}

export default Field;
