"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);
    if (res?.error) setError("Credenciales inválidas o usuario inactivo.");
    if (res?.ok) window.location.href = res.url ?? callbackUrl;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-blue px-4 sm:px-6">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/3 h-64 w-64 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="absolute -right-32 bottom-1/3 h-80 w-80 rounded-full bg-brand-blue-light/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30">

          {/* Top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-gold" />

          <div className="p-8 sm:p-10">
            {/* Logo + title */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-brand-blue/15 border border-zinc-100 overflow-hidden p-1">
                <Image
                  src="/logo.png"
                  alt="Logo Escuela Prof. Felipe Montes Gómez"
                  width={72}
                  height={72}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-blue">
                  Acceso Institucional
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Escuela Primaria Prof. Felipe Montes Gómez
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Correo Electrónico
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="usuario@escuela.local"
                  autoComplete="username"
                  required
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/8"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Contraseña
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/8"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition-all hover:bg-brand-blue-light hover:shadow-brand-blue/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 bg-zinc-50 px-8 py-5 text-center">
            <p className="text-xs text-muted-foreground">
              ¿Problemas para acceder?{" "}
              <span className="font-medium text-brand-blue">Contacta a la Dirección</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
