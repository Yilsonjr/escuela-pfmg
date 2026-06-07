import { prisma } from "@/lib/prisma";

export type AppModuleInfo = {
  key: string;
  name: string;
  icon: string;
  href: string;
  enabled: boolean;
  order: number;
};

/** Default modules — used as fallback if DB has no modules yet */
export const DEFAULT_MODULES: AppModuleInfo[] = [
  { key: "personal", name: "Personal", icon: "Users", href: "/admin/personal", enabled: true, order: 1 },
  { key: "alumnado", name: "Alumnado", icon: "ClipboardList", href: "/admin/alumnado", enabled: true, order: 2 },
  { key: "asistencia", name: "Asistencia", icon: "CalendarDays", href: "/admin/asistencia", enabled: true, order: 3 },
  { key: "alertas", name: "Alertas", icon: "Bell", href: "/admin/alertas", enabled: true, order: 4 },
  { key: "documentos", name: "Documentos", icon: "FileText", href: "/admin/documentos", enabled: true, order: 5 },
  { key: "metricas", name: "Métricas", icon: "Gauge", href: "/admin/metricas", enabled: true, order: 6 },
  { key: "apmae", name: "APMAE", icon: "Users", href: "/admin/apmae/calendario", enabled: true, order: 7 },
];

/**
 * Get all modules from the database.
 * Falls back to DEFAULT_MODULES if none exist yet.
 */
export async function getModules(): Promise<AppModuleInfo[]> {
  try {
    const modules = await prisma.appModule.findMany({
      orderBy: { order: "asc" },
    });
    if (modules.length === 0) return DEFAULT_MODULES;
    return modules;
  } catch {
    return DEFAULT_MODULES;
  }
}

/**
 * Get only enabled modules (for sidebar navigation).
 */
export async function getEnabledModules(): Promise<AppModuleInfo[]> {
  try {
    const modules = await prisma.appModule.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    });
    if (modules.length === 0) return DEFAULT_MODULES;
    return modules;
  } catch {
    return DEFAULT_MODULES;
  }
}

/**
 * Check if a specific module is enabled.
 */
export async function isModuleEnabled(key: string): Promise<boolean> {
  try {
    const mod = await prisma.appModule.findUnique({ where: { key } });
    // If module doesn't exist in DB, assume enabled (backward compat)
    return mod?.enabled ?? true;
  } catch {
    return true;
  }
}
