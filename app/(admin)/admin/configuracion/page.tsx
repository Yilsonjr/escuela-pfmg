import { revalidatePath } from "next/cache";
import {
  Settings2, LayoutGrid, Info, School,
  Users, GraduationCap, CalendarCheck, Bell,
  FileText, Gauge, UsersRound, Settings,
  type LucideIcon,
} from "lucide-react";

import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getModules, DEFAULT_MODULES } from "@/lib/modules";
import { getSchoolProfile } from "@/lib/school-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ── Module meta ───────────────────────────────────────────── */

type ModuleMeta = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderColor: string;
};

const MODULE_META: Record<string, ModuleMeta> = {
  personal:   { icon: Users,        iconBg: "bg-violet-100",      iconColor: "text-violet-600",  borderColor: "#7c3aed" },
  alumnado:   { icon: GraduationCap,iconBg: "bg-brand-blue/10",   iconColor: "text-brand-blue",  borderColor: "#092e66" },
  asistencia: { icon: CalendarCheck,iconBg: "bg-emerald-100",     iconColor: "text-emerald-600", borderColor: "#059669" },
  alertas:    { icon: Bell,         iconBg: "bg-amber-100",       iconColor: "text-amber-600",   borderColor: "#d97706" },
  documentos: { icon: FileText,     iconBg: "bg-sky-100",         iconColor: "text-sky-600",     borderColor: "#0284c7" },
  metricas:   { icon: Gauge,        iconBg: "bg-rose-100",        iconColor: "text-rose-600",    borderColor: "#e11d48" },
  apmae:      { icon: UsersRound,   iconBg: "bg-teal-100",        iconColor: "text-teal-600",    borderColor: "#0d9488" },
};

const FALLBACK_META: ModuleMeta = {
  icon: Settings, iconBg: "bg-zinc-100", iconColor: "text-zinc-500", borderColor: "#a1a1aa",
};

/* ── Server Actions ────────────────────────────────────────── */

async function saveSchoolProfile(formData: FormData) {
  "use server";
  const data = {
    name:         String(formData.get("name") ?? "").trim(),
    shortName:    String(formData.get("shortName") ?? "").trim(),
    subtitle:     String(formData.get("subtitle") ?? "").trim(),
    location:     String(formData.get("location") ?? "").trim(),
    phone:        String(formData.get("phone") ?? "").trim(),
    email:        String(formData.get("email") ?? "").trim(),
    foundedYear:  parseInt(String(formData.get("foundedYear") ?? "2014"), 10),
    approvalRate: String(formData.get("approvalRate") ?? "").trim(),
  };
  await prisma.schoolProfile.upsert({
    where:  { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  revalidatePath("/admin/configuracion");
  revalidatePath("/");
}

async function toggleModule(formData: FormData) {
  "use server";
  const key = String(formData.get("key") ?? "");
  const currentEnabled = formData.get("enabled") === "true";
  if (!key) return;
  await prisma.appModule.update({ where: { key }, data: { enabled: !currentEnabled } });
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
}

async function initializeModules() {
  "use server";
  for (const mod of DEFAULT_MODULES) {
    await prisma.appModule.upsert({
      where: { key: mod.key },
      update: {},
      create: { key: mod.key, name: mod.name, icon: mod.icon, href: mod.href, enabled: mod.enabled, order: mod.order },
    });
  }
  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function ConfiguracionPage() {
  await requirePermission("center:manage");

  const [modules, hasModulesInDb, profile] = await Promise.all([
    getModules(),
    prisma.appModule.count(),
    getSchoolProfile(),
  ]);
  const enabledCount = modules.filter((m) => m.enabled).length;
  const totalCount   = modules.length;

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue">
          <Settings2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-800">Configuración</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Activa o desactiva módulos del portal según las necesidades del centro.
          </p>
        </div>
      </div>

      {/* ── Información del Centro ──────────────────────── */}
      <div className="flex items-center gap-2 mt-2">
        <School className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Información del Centro
        </h2>
      </div>

      <form action={saveSchoolProfile}>
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Nombre completo</label>
                <input name="name" defaultValue={profile.name}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Nombre corto</label>
                <input name="shortName" defaultValue={profile.shortName}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Subtítulo</label>
                <input name="subtitle" defaultValue={profile.subtitle}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Ubicación</label>
                <input name="location" defaultValue={profile.location}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Teléfono</label>
                <input name="phone" defaultValue={profile.phone} type="tel"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Correo electrónico</label>
                <input name="email" defaultValue={profile.email} type="email"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Año de fundación</label>
                <input name="foundedYear" defaultValue={profile.foundedYear} type="number" min="1900" max="2100"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Tasa de aprobación</label>
                <input name="approvalRate" defaultValue={profile.approvalRate} placeholder="ej. 97%"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/10" />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit">Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="border-t border-zinc-100" />

      {/* ── Initialize banner ───────────────────────────── */}
      {hasModulesInDb === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Settings2 className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-800">Los módulos aún no están configurados</p>
              <p className="text-sm text-zinc-500">Inicializa los módulos para poder activarlos o desactivarlos.</p>
            </div>
            <form action={initializeModules}>
              <Button type="submit">Inicializar módulos</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Section header ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Módulos del portal
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {enabledCount} de {totalCount} activos
        </span>
      </div>

      {/* ── Module cards ────────────────────────────────── */}
      <div className="space-y-2">
        {modules.map((mod) => {
          const meta  = MODULE_META[mod.key] ?? FALLBACK_META;
          const Icon  = meta.icon;
          const active = mod.enabled;

          return (
            <div
              key={mod.key}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all ${
                active
                  ? "border-zinc-200 bg-white shadow-sm"
                  : "border-zinc-200 bg-zinc-50 opacity-60 hover:opacity-80"
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: active ? meta.borderColor : "#d1d5db" }}
            >
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? meta.iconBg : "bg-zinc-200"}`}>
                <Icon className={`h-5 w-5 ${active ? meta.iconColor : "text-zinc-400"}`} strokeWidth={1.5} />
              </div>

              {/* Name + route */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${active ? "text-zinc-800" : "text-zinc-500"}`}>
                  {mod.name}
                </p>
                <code className={`mt-0.5 inline-block rounded-md px-2 py-0.5 font-mono text-xs ${
                  active ? "bg-zinc-100 text-zinc-500" : "bg-zinc-200 text-zinc-400"
                }`}>
                  {mod.href}
                </code>
              </div>

              {/* Status badge */}
              {active ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Activo
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  Desactivado
                </span>
              )}

              {/* Toggle */}
              {hasModulesInDb > 0 && (
                <form action={toggleModule}>
                  <input type="hidden" name="key" value={mod.key} />
                  <input type="hidden" name="enabled" value={String(mod.enabled)} />
                  <button
                    type="submit"
                    title={active ? "Desactivar módulo" : "Activar módulo"}
                    className="group flex shrink-0 items-center"
                  >
                    {/* Custom pill toggle */}
                    <div className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                      active ? "bg-emerald-500" : "bg-zinc-300"
                    }`}>
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        active ? "translate-x-5" : "translate-x-1"
                      }`} />
                    </div>
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Info callout ────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Nota:</span> Los módulos desactivados desaparecen del menú lateral para todos los usuarios.
          Solo la <span className="font-semibold">Directora</span> puede cambiar esta configuración.
        </p>
      </div>

    </div>
  );
}
