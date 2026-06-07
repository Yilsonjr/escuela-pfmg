import Link from "next/link";
import { BookOpen, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-blue shadow-lg">
          <BookOpen className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>

        {/* Error code */}
        <p className="text-8xl font-bold tracking-tight text-brand-blue/10 select-none">
          404
        </p>

        <div className="-mt-4">
          <h1 className="text-2xl font-bold text-zinc-800">
            Página no encontrada
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            La página que buscas no existe o fue movida.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue-light transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Portal administrativo
          </Link>
        </div>

        <p className="mt-8 text-xs text-zinc-400">
          Escuela Primaria Prof. Felipe Montes Gómez
        </p>
      </div>
    </div>
  );
}
