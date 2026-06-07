import { type LucideIcon } from "lucide-react";
import { cn } from "@/components/lib/cn";

export function ModuleHeader({
  title,
  description,
  icon: Icon,
  iconBg = "bg-brand-blue",
  iconColor = "text-white",
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-800">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Shared class for search inputs across all modules */
export const SEARCH_CLS =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none hover:border-zinc-300 focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10";

/** Shared class for select dropdowns */
export const SELECT_CLS =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none hover:border-zinc-300 focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10 cursor-pointer";

/** Info/notice banner */
export function InfoBanner({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning" | "permission";
}) {
  const styles = {
    info:       "border-blue-200 bg-blue-50 text-blue-800",
    warning:    "border-amber-200 bg-amber-50 text-amber-800",
    permission: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border px-5 py-4", styles[variant])}>
      <span className="mt-0.5 text-base">
        {variant === "permission" ? "🔒" : variant === "warning" ? "⚠️" : "ℹ️"}
      </span>
      <p className="text-sm">{children}</p>
    </div>
  );
}
