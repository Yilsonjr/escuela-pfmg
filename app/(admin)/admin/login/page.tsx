"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { BookOpen, ShieldCheck, Loader2 } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-brand-sky/30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] px-4 sm:px-6">
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Decoraciones de fondo */}
        <div className="absolute -left-4 -top-4 h-24 w-24 animate-pulse-slow rounded-full bg-brand-gold/20 blur-2xl"></div>
        <div className="absolute -bottom-4 -right-4 h-32 w-32 animate-pulse-slow rounded-full bg-brand-blue/20 blur-2xl" style={{ animationDelay: "1s" }}></div>
        
        {/* Tarjeta de Login */}
        <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-2xl shadow-brand-blue/10 backdrop-blur-xl border border-white">
          <div className="h-2 w-full bg-gradient-to-r from-brand-blue to-brand-gold"></div>
          
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue-light to-brand-blue text-white shadow-lg shadow-brand-blue/30 mb-6">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-brand-blue tracking-tight">Acceso Institucional</h2>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                Escuela Primaria Prof. Felipe Montes Gómez
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-blue/80">Correo Electrónico</label>
                <div className="relative">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="usuario@escuela.local"
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border-2 border-brand-sky bg-white/50 px-4 py-3.5 text-sm transition-all focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-gold/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-blue/80">Contraseña</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border-2 border-brand-sky bg-white/50 px-4 py-3.5 text-sm transition-all focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-gold/10"
                />
              </div>

              {error && (
                <div className="animate-fade-in rounded-xl border border-red-500/20 bg-red-50 p-4 text-sm font-medium text-red-600 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-red-500 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-blue-light hover:shadow-brand-blue/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
                    Verificando credenciales...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-brand-sky/20 px-8 py-6 text-center text-xs font-medium text-muted-foreground border-t border-brand-sky/50">
            ¿Problemas para acceder? Contacta a la Dirección.
          </div>
        </div>
      </div>
    </div>
  );
}

