import * as React from "react";

import { cn } from "@/components/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10",
        className,
      )}
      {...props}
    />
  );
}
