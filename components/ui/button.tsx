import * as React from "react";

import { cn } from "@/components/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-9 px-4" : "h-11 px-5",
        variant === "primary" &&
          "bg-brand-blue text-white hover:opacity-95 active:opacity-90",
        variant === "secondary" &&
          "border border-black/10 bg-white hover:bg-black/[.02]",
        variant === "ghost" && "hover:bg-black/[.04]",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}

