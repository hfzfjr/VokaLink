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
    | "danger"
    | "blue"
    | "blueSecondary";
  size?: "default" | "sm" | "lg" | "mentor";
  loading?: boolean;
  pill?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      loading = false,
      pill = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        "bg-sky-500 text-white hover:bg-sky-600 font-bold shadow-xs focus-visible:ring-sky-500",
      secondary:
        "bg-slate-900 text-white hover:bg-slate-800 font-semibold focus-visible:ring-slate-900",
      outline:
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold focus-visible:ring-sky-500",
      ghost:
        "text-slate-700 hover:bg-slate-100 font-medium focus-visible:ring-slate-900",
      link:
        "text-sky-600 hover:underline p-0 h-auto font-semibold focus-visible:ring-sky-500",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 font-semibold focus-visible:ring-rose-600",
      blue:
        "bg-sky-500 text-white hover:bg-sky-600 font-semibold shadow-pill focus-visible:ring-sky-500",
      blueSecondary:
        "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-semibold focus-visible:ring-sky-500",
    };

    const sizeClasses = {
      default: "h-11 lg:h-10 px-4 text-sm rounded-xl",
      sm: "h-9 px-3 text-xs rounded-xl",
      lg: "h-12 px-6 text-base rounded-xl",
      mentor: "h-14 px-6 text-base rounded-2xl", // 56px area sentuh mentor
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
          pill && "rounded-full",
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
