import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, Gauge, LayoutDashboard, Users, BookOpen, LogOut, Bell } from "lucide-react";

import { getSession } from "@/lib/server-session";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-brand-sky/20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] font-sans">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
        
        {/* Sidebar */}
        <aside className="flex w-full flex-col gap-6 md:w-[280px] shrink-0">
          <div className="sticky top-6 flex flex-col gap-6">
            
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-blue/5 border border-white">
              <div className="h-2 w-full bg-gradient-to-r from-brand-blue to-brand-gold"></div>
              
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue-light to-brand-blue text-white shadow-md">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-bold text-brand-blue">Portal Administrativo</div>
                    <div className="text-xs font-medium text-brand-gold truncate max-w-[150px]">
                      {session?.user?.name ?? session?.user?.email ?? "Usuario"}
                    </div>
                  </div>
                </div>

                <nav className="mt-6 flex flex-col gap-1.5">
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-brand-blue transition-all hover:bg-brand-sky/50" href="/admin">
                    <LayoutDashboard className="h-5 w-5 text-brand-blue-light transition-transform group-hover:scale-110" /> 
                    Dashboard
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-sky/50 hover:text-brand-blue" href="/admin/personal">
                    <Users className="h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Personal
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-sky/50 hover:text-brand-blue" href="/admin/alumnado">
                    <ClipboardList className="h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Alumnado
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-sky/50 hover:text-brand-blue" href="/admin/asistencia">
                    <CalendarDays className="h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Asistencia
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-sky/50 hover:text-brand-blue" href="/admin/documentos">
                    <FileText className="h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Documentos
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-sky/50 hover:text-brand-blue" href="/admin/apmae/calendario">
                    <Users className="h-5 w-5 transition-transform group-hover:scale-110" /> 
                    APMAE
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-sky/50 hover:text-brand-blue" href="/admin/metricas">
                    <Gauge className="h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Métricas
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-brand-sky/50 hover:text-brand-blue" href="/admin/alertas">
                    <Bell className="h-5 w-5 transition-transform group-hover:scale-110" /> 
                    Alertas
                  </Link>
                </nav>

                <div className="mt-6 border-t border-brand-sky/50 pt-6">
                  <SignOutButton />
                </div>
              </div>
            </div>
            
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 animate-fade-in">
          <div className="min-h-[calc(100vh-3rem)] rounded-3xl bg-white p-6 shadow-xl shadow-brand-blue/5 md:p-8 border border-white">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}

