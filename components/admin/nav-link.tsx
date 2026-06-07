"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Users,
  BookOpen,
  Bell,
  Settings,
  GraduationCap,
  CalendarCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/lib/cn";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  ClipboardList,
  CalendarDays,
  CalendarCheck,
  FileText,
  Gauge,
  Bell,
  BookOpen,
  Settings,
  LayoutDashboard,
  GraduationCap,
  UsersRound,
};

/** Per-module accent color for the active icon */
const ICON_ACTIVE_COLOR: Record<string, string> = {
  personal:    "text-violet-600",
  alumnado:    "text-brand-blue",
  asistencia:  "text-emerald-600",
  alertas:     "text-amber-600",
  documentos:  "text-sky-600",
  metricas:    "text-rose-600",
  apmae:       "text-teal-600",
  dashboard:   "text-brand-blue",
  configuracion:"text-zinc-600",
};

/** Per-module icon bg tint for active state */
const ICON_ACTIVE_BG: Record<string, string> = {
  personal:    "bg-violet-50",
  alumnado:    "bg-brand-blue/10",
  asistencia:  "bg-emerald-50",
  alertas:     "bg-amber-50",
  documentos:  "bg-sky-50",
  metricas:    "bg-rose-50",
  apmae:       "bg-teal-50",
  dashboard:   "bg-brand-blue/10",
  configuracion:"bg-zinc-100",
};

function keyFromHref(href: string) {
  const parts = href.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (last === "admin") return "dashboard";
  if (last === "calendario") return "apmae";
  return last ?? "dashboard";
}

export function NavLink({
  href,
  iconName,
  label,
  exact = false,
}: {
  href: string;
  iconName: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  const Icon = ICON_MAP[iconName] ?? FileText;
  const key = keyFromHref(href);
  const activeIconColor = ICON_ACTIVE_COLOR[key] ?? "text-brand-blue";
  const activeIconBg    = ICON_ACTIVE_BG[key]    ?? "bg-brand-blue/10";

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
        isActive
          ? "bg-brand-sky/60 font-semibold text-brand-blue"
          : "font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
      )}
    >
      {/* Icon wrapper */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
        isActive ? activeIconBg : "group-hover:bg-zinc-100",
      )}>
        <Icon
          className={cn(
            "h-4 w-4 transition-all",
            isActive ? activeIconColor : "text-zinc-400 group-hover:text-zinc-600",
          )}
          strokeWidth={isActive ? 2 : 1.5}
        />
      </div>

      <span className="flex-1">{label}</span>

      {/* Active indicator */}
      {isActive && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
      )}
    </Link>
  );
}
