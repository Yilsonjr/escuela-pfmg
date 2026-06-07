"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" strokeWidth={1.5} />
      </div>

      <h2 className="text-xl font-bold text-zinc-800">
        Error al cargar este módulo
      </h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Ocurrió un problema al cargar esta página. Intenta de nuevo o regresa al Dashboard.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-zinc-400">Ref: {error.digest}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-light transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
        <a
          href="/admin"
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </a>
      </div>
    </div>
  );
}
