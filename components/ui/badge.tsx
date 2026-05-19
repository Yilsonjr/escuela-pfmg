import * as React from "react";

import { cn } from "@/components/lib/cn";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "green" | "yellow" | "red" | "blue";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        variant === "neutral" && "border-black/10 bg-black/[.03] text-black",
        variant === "blue" && "border-brand-blue/20 bg-brand-blue/10 text-brand-blue",
        variant === "green" && "border-emerald-600/20 bg-emerald-600/10 text-emerald-700",
        variant === "yellow" && "border-amber-600/20 bg-amber-600/10 text-amber-800",
        variant === "red" && "border-red-600/20 bg-red-600/10 text-red-700",
        className,
      )}
      {...props}
    />
  );
}

