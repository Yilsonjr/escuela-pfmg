"use client";

import { useEffect } from "react";
import { BookOpen, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring service in production
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500 shadow-lg">
          <BookOpen className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>

        <p className="text-8xl font-bold tracking-tight text-red-500/10 select-none">
          500
        </p>

        <div className="-mt-4">
          <h1 className="text-2xl font-bold text-zinc-800">
            Algo salió mal
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Ocurrió un error inesperado. Por favor intenta de nuevo o contacta al administrador.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-zinc-400">
              Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue-light transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </button>
          <a
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir al portal
          </a>
        </div>

        <p className="mt-8 text-xs text-zinc-400">
          Escuela Primaria Prof. Felipe Montes Gómez
        </p>
      </div>
    </div>
  );
}
