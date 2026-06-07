"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { NavLink } from "@/components/admin/nav-link";

type ModuleInfo = {
  key: string;
  name: string;
  icon: string;
  href: string;
};

export function MobileSidebar({
  userName,
  modules,
  canManageCenter,
}: {
  userName: string;
  modules: ModuleInfo[];
  canManageCenter: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB — mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg shadow-brand-blue/30 transition-transform active:scale-95 md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" strokeWidth={1.5} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Accent bar */}
        <div className="h-1 w-full bg-brand-blue" />

        <div className="flex h-[calc(100%-6px)] flex-col p-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md border border-zinc-100 overflow-hidden p-0.5">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-brand-blue leading-tight">Portal</p>
                <p className="text-xs font-semibold text-brand-gold truncate max-w-[140px]">
                  {userName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation — reuse NavLink */}
          <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto" onClick={() => setOpen(false)}>
            <NavLink href="/admin" iconName="LayoutDashboard" label="Dashboard" exact />

            {modules.map((mod) => (
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
                <NavLink href="/admin/configuracion" iconName="Settings" label="Configuración" />
              </>
            )}
          </nav>

          {/* Sign out */}
          <div className="border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg group-hover:bg-red-100 transition-all">
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </div>
              Salir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
