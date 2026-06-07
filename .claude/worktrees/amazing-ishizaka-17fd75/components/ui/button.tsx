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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-9 px-4" : "h-11 px-5",
        variant === "primary" &&
          "bg-brand-blue text-white shadow-sm hover:bg-brand-blue-light active:scale-[0.98]",
        variant === "secondary" &&
          "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98]",
        variant === "ghost" &&
          "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
        className,
      )}
      {...props}
    />
  );
}
