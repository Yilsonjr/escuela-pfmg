"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { School } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-white to-brand-blue/5">
      <div className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-blue text-white">
            <School className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-muted-foreground">Acceso privado</div>
            <div className="text-lg font-semibold">Sistema Administrativo</div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-8 rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="usuario@escuela.local"
              autoComplete="username"
              required
            />
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button className="mt-6 w-full" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>

          <div className="mt-4 text-xs text-muted-foreground">
            Si eres personal del centro y no tienes acceso, solicita tu cuenta a Dirección.
          </div>
        </form>
      </div>
    </div>
  );
}

