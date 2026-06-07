import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Settings } from "lucide-react";

import { getSession } from "@/lib/server-session";
import { hasPermission } from "@/lib/rbac";
import { getEnabledModules } from "@/lib/modules";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { NavLink } from "@/components/admin/nav-link";

/** Accent color per module key for the sidebar */
const MODULE_COLORS: Record<string, string> = {
  personal:    "text-violet-500",
  alumnado:    "text-brand-blue",
  asistencia:  "text-emerald-500",
  alertas:     "text-amber-500",
  documentos:  "text-sky-500",
  metricas:    "text-rose-500",
  apmae:       "text-teal-500",
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const permissions = session?.user?.permissions as string[] | undefined;
  const canManageCenter = hasPermission(permissions, "center:manage");
  const userName = session?.user?.name ?? session?.user?.email ?? "Usuario";

  const enabledModules = await getEnabledModules();

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6">

        {/* ── Desktop Sidebar ─────────────────────────────── */}
        <aside className="hidden md:flex w-[260px] flex-col gap-6 shrink-0">
          <div className="sticky top-6">
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-blue/5 border border-white/80">

              {/* Accent bar */}
              <div className="h-1 w-full bg-brand-blue" />

              <div className="p-4">
                {/* User header — clickable to /admin/perfil */}
                <Link
                  href="/admin/perfil"
                  className="flex items-center gap-3 pb-4 border-b border-zinc-100 group hover:opacity-80 transition-opacity"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-md border border-zinc-100 overflow-hidden p-0.5">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={36}
                      height={36}
                      className="h-full w-full object-contain"
                    />
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-blue leading-tight truncate">
                      Portal Administrativo
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-brand-gold truncate">
                      {userName}
                    </p>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="mt-3 flex flex-col gap-0.5">
                  <NavLink
                    href="/admin"
                    iconName="LayoutDashboard"
                    label="Dashboard"
                    exact
                  />

                  {enabledModules.map((mod) => (
                    <NavLink
                      key={mod.key}
                      href={mod.href}
                      iconName={mod.icon}
                      label={mod.name}
                    />
                  ))}

                  {canManageCenter && (
                    <>
                      <div className="my-1 border-t border-zinc-100" />
                      <NavLink
                        href="/admin/configuracion"
                        iconName="Settings"
                        label="Configuración"
                      />
                    </>
                  )}
                </nav>

                {/* Sign out */}
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  <SignOutButton />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Mobile Sidebar ───────────────────────────────── */}
        <MobileSidebar
          userName={userName}
          modules={enabledModules.map((m) => ({
            key: m.key,
            name: m.name,
            icon: m.icon,
            href: m.href,
          }))}
          canManageCenter={canManageCenter}
        />

        {/* ── Main Content ─────────────────────────────────── */}
        <main className="flex-1 animate-fade-in">
          <div className="min-h-[calc(100vh-3rem)] rounded-3xl bg-white p-6 shadow-xl shadow-brand-blue/5 md:p-8 border border-white/80">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
