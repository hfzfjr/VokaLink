import * as React from "react";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "danger";
  size?: "default" | "sm" | "lg" | "mentor";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        "bg-safety-500 text-ink-900 hover:bg-safety-400 font-semibold focus-visible:ring-safety-500",
      secondary:
        "bg-ink-900 text-white hover:bg-ink-700 font-semibold focus-visible:ring-ink-900",
      outline:
        "border border-ink-200 bg-white text-ink-900 hover:bg-ink-50 font-semibold focus-visible:ring-ink-900",
      ghost:
        "text-ink-700 hover:bg-ink-100 font-medium focus-visible:ring-ink-900",
      link:
        "text-safety-700 hover:underline p-0 h-auto font-medium focus-visible:ring-safety-500",
      danger:
        "bg-danger-700 text-white hover:bg-danger-700/90 font-semibold focus-visible:ring-danger-700",
    };

    const sizeClasses = {
      default: "h-12 lg:h-10 px-4 text-sm rounded-lg",
      sm: "h-9 px-3 text-xs rounded-lg",
      lg: "h-12 px-6 text-base rounded-lg",
      mentor: "h-14 px-6 text-base rounded-lg", // 56px area sentuh mentor
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variantClasses[variant],
          variant !== "link" && sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
