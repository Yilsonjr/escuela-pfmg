import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { KeyRound, User, ShieldCheck, AlertCircle } from "lucide-react";
import bcrypt from "bcryptjs";

import { requireAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/ui/module-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ── Server Actions ────────────────────────────────────────── */

async function changePassword(formData: FormData) {
  "use server";

  const session = await requireAuth();
  const userId  = session.user?.id;
  if (!userId) redirect("/admin/login");

  const current    = String(formData.get("current")    ?? "");
  const next       = String(formData.get("next")       ?? "");
  const confirm    = String(formData.get("confirm")    ?? "");

  // Validations
  if (!current || !next || !confirm) {
    redirect("/admin/perfil?error=campos");
  }
  if (next.length < 8) {
    redirect("/admin/perfil?error=corta");
  }
  if (next !== confirm) {
    redirect("/admin/perfil?error=mismatch");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) redirect("/admin/perfil?error=nopass");

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) redirect("/admin/perfil?error=wrong");

  const hash = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  revalidatePath("/admin/perfil");
  redirect("/admin/perfil?success=1");
}

/* ── Error messages ────────────────────────────────────────── */

const ERROR_MSGS: Record<string, string> = {
  campos:   "Completa todos los campos.",
  corta:    "La nueva contraseña debe tener al menos 8 caracteres.",
  mismatch: "La nueva contraseña y la confirmación no coinciden.",
  wrong:    "La contraseña actual es incorrecta.",
  nopass:   "Tu cuenta no tiene contraseña configurada. Contacta al administrador.",
};

/* ── Page ──────────────────────────────────────────────────── */

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireAuth();
  const params  = await searchParams;
  const error   = params.error ? ERROR_MSGS[params.error] ?? "Ocurrió un error." : null;
  const success = params.success === "1";

  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
    include: {
      staff: true,
      roles: { include: { role: true } },
    },
  });

  const roleNames = user?.roles.map((r) => r.role.name).join(", ") ?? "—";

  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Mi perfil"
        description="Información de tu cuenta y seguridad"
        icon={User}
        iconBg="bg-brand-blue"
        iconColor="text-white"
      />

      {/* ── Info de cuenta ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
              <User className="h-5 w-5 text-brand-blue" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle>Información de la cuenta</CardTitle>
              <CardDescription>Datos asociados a tu usuario</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Nombre</p>
              <p className="text-sm font-semibold text-zinc-800">
                {user?.staff
                  ? `${user.staff.firstName} ${user.staff.lastName}`
                  : user?.name ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Correo electrónico</p>
              <p className="text-sm font-semibold text-zinc-800">{user?.email ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Rol</p>
              <p className="text-sm font-semibold text-zinc-800">{roleNames}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Estado</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Activo
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cambiar contraseña ───────────────────────────── */}
      <Card className={success ? "border-emerald-200 ring-2 ring-emerald-100" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${success ? "bg-emerald-100" : "bg-brand-blue/10"}`}>
              <KeyRound className={`h-5 w-5 ${success ? "text-emerald-600" : "text-brand-blue"}`} strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>
                Usa una contraseña de al menos 8 caracteres con letras y números.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          {/* Success banner */}
          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-emerald-800">¡Contraseña actualizada!</p>
                <p className="text-xs text-emerald-600">Tu contraseña fue cambiada exitosamente.</p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}

          <form action={changePassword} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">
                Contraseña actual <span className="text-red-500">*</span>
              </label>
              <Input
                name="current"
                type="password"
                placeholder="Tu contraseña actual"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">
                Nueva contraseña <span className="text-red-500">*</span>
              </label>
              <Input
                name="next"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">
                Confirmar nueva contraseña <span className="text-red-500">*</span>
              </label>
              <Input
                name="confirm"
                type="password"
                placeholder="Repite la nueva contraseña"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="pt-1">
              <Button type="submit">
                <KeyRound className="h-4 w-4" />
                Actualizar contraseña
              </Button>
            </div>
          </form>

        </CardContent>
      </Card>

      {/* ── Seguridad info ───────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Recomendación:</span> Usa una contraseña única que no uses en otros sitios.
          Combina letras mayúsculas, minúsculas, números y símbolos.
        </p>
      </div>

    </div>
  );
}
