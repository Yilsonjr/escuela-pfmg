import * as React from "react";

import { cn } from "@/components/lib/cn";

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <div className="overflow-auto">
        <table className={cn("w-full text-sm", className)} {...props} />
      </div>
    </div>
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-zinc-200 bg-zinc-50", className)} {...props} />;
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-zinc-100", className)} {...props} />;
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-zinc-50 transition-colors", className)} {...props} />;
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle text-zinc-700", className)} {...props} />;
}
