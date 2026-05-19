import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, Gauge, LayoutDashboard, Users } from "lucide-react";

import { getSession } from "@/lib/server-session";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-10 w-10 rounded-2xl bg-brand-blue text-white grid place-items-center font-semibold">
              PFM
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Administración</div>
              <div className="text-xs text-muted-foreground">
                {session?.user?.name ?? session?.user?.email ?? "Usuario"}
              </div>
            </div>
          </div>

          <nav className="mt-4 grid gap-1">
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin/personal">
              <Users className="h-4 w-4" /> Personal
            </Link>
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin/alumnado">
              <ClipboardList className="h-4 w-4" /> Alumnado
            </Link>
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin/asistencia">
              <Gauge className="h-4 w-4" /> Asistencia
            </Link>
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin/documentos">
              <FileText className="h-4 w-4" /> Documentos
            </Link>
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin/apmae/calendario">
              <CalendarDays className="h-4 w-4" /> APMAE
            </Link>
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin/metricas">
              <Gauge className="h-4 w-4" /> Métricas
            </Link>
            <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-black/[.03]" href="/admin/alertas">
              <Gauge className="h-4 w-4" /> Alertas
            </Link>
          </nav>

          <div className="mt-4 border-t border-black/5 pt-4">
            <SignOutButton />
          </div>
        </aside>

        <main className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}

