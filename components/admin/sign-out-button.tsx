"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500"
    >
      <LogOut
        className="h-4 w-4 transition-all group-hover:scale-110"
        strokeWidth={1.5}
      />
      Salir
    </button>
  );
}
