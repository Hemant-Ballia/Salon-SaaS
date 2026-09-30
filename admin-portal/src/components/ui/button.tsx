import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap select-none font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer";

    const variantStyles = {
      primary:
        "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md focus-visible:ring-emerald-500",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400",
      outline:
        "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-emerald-500",
      destructive:
        "bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow-md focus-visible:ring-rose-500",
      ghost:
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
      link: "text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 p-0 h-auto active:scale-100",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    const loaderSizeStyles = {
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4",
      lg: "w-4.5 h-4.5",
      icon: "w-4 h-4",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className={cn(loaderSizeStyles[size], "animate-spin shrink-0")} />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";