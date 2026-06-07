import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  UserPlus, Shield, Pencil, UserX, UserCheck,
  KeyRound, Trash2, Users, ShieldAlert,
} from "lucide-react";

import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ModuleHeader } from "@/components/ui/module-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

/* ── Constants ─────────────────────────────────────────────── */

const ROLE_COLORS: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  DIRECTORA:      "blue",
  ADMINISTRATIVO: "yellow",
  DOCENTE:        "green",
  PSICOLOGIA:     "green",
  APOYO:          "neutral",
};

const SELECT_CLS = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none hover:border-zinc-300 focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10 cursor-pointer";

/* ── Schema ────────────────────────────────────────────────── */

const userSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  roleKey:  z.string().min(1),
  staffId:  z.string().optional().or(z.literal("")),
});

/* ── Server Actions ────────────────────────────────────────── */

async function createUser(formData: FormData) {
  "use server";
  await requirePermission("center:manage");

  const parsed = userSchema.safeParse({
    name:     formData.get("name"),
    email:    formData.get("email"),
    password: formData.get("password"),
    roleKey:  formData.get("roleKey"),
    staffId:  formData.get("staffId"),
  });
  if (!parsed.success) return;

  const { name, email, password, roleKey, staffId } = parsed.data;
  if (!password) return;

  const passwordHash = await bcrypt.hash(password, 12);

  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      isActive: true,
      staffId: staffId || null,
    },
  });

  await prisma.userRole.create({
    data: { userId: user.id, roleId: role.id },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?success=created");
}

async function updateUserRole(formData: FormData) {
  "use server";
  await requirePermission("center:manage");

  const userId  = String(formData.get("userId") ?? "");
  const roleKey = String(formData.get("roleKey") ?? "");
  if (!userId || !roleKey) return;

  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) return;

  // Replace all roles with the new one
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.userRole.create({ data: { userId, roleId: role.id } });

  revalidatePath("/admin/usuarios");
}

async function resetPassword(formData: FormData) {
  "use server";
  await requirePermission("center:manage");

  const userId      = String(formData.get("userId") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (!userId || newPassword.length < 8) return;

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  revalidatePath("/admin/usuarios");
}

async function toggleUserStatus(formData: FormData) {
  "use server";
  await requirePermission("center:manage");

  const userId    = String(formData.get("userId") ?? "");
  const isActive  = formData.get("isActive") === "true";
  if (!userId) return;

  await prisma.user.update({ where: { id: userId }, data: { isActive: !isActive } });
  revalidatePath("/admin/usuarios");
}

async function deleteUser(formData: FormData) {
  "use server";
  await requirePermission("center:manage");

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/usuarios");
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; success?: string }>;
}) {
  await requirePermission("center:manage");

  const params  = await searchParams;
  const editId  = params.edit ?? "";
  const success = params.success;

  const [users, roles, staffList] = await Promise.all([
    prisma.user.findMany({
      include: {
        roles:  { include: { role: true } },
        staff:  true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({ orderBy: { key: "asc" } }),
    prisma.staff.findMany({
      where: { user: null }, // staff without a linked user
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const editing = editId ? users.find((u) => u.id === editId) : null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <ModuleHeader
        title="Gestión de usuarios"
        description={`${users.length} usuario${users.length !== 1 ? "s" : ""} registrados en el portal`}
        icon={Shield}
        iconBg="bg-brand-blue"
        iconColor="text-white"
        actions={
          <a href="#form-usuario">
            <Button size="sm">
              <UserPlus className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </a>
        }
      />

      {/* Success banner */}
      {success === "created" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <UserCheck className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-emerald-800">Usuario creado exitosamente.</p>
        </div>
      )}

      {/* ── Tabla de usuarios ────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Usuario</TH>
                <TH>Email</TH>
                <TH>Rol</TH>
                <TH>Personal vinculado</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {users.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                        <Users className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-700">No hay usuarios registrados</p>
                    </div>
                  </TD>
                </TR>
              ) : (
                users.map((u) => {
                  const roleKey = u.roles[0]?.role.key ?? "";
                  const roleName = u.roles[0]?.role.name ?? "Sin rol";
                  const initials = (u.name ?? u.email ?? "?").charAt(0).toUpperCase();

                  return (
                    <TR key={u.id}>
                      {/* Name + avatar */}
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
                            {initials}
                          </div>
                          <p className="font-semibold text-zinc-800">{u.name ?? "—"}</p>
                        </div>
                      </TD>
                      <TD className="text-zinc-600">{u.email ?? "—"}</TD>
                      <TD>
                        <Badge variant={ROLE_COLORS[roleKey] ?? "neutral"}>
                          {roleName}
                        </Badge>
                      </TD>
                      <TD className="text-zinc-600">
                        {u.staff ? `${u.staff.firstName} ${u.staff.lastName}` : <span className="text-zinc-300">—</span>}
                      </TD>
                      <TD>
                        {u.isActive
                          ? <Badge variant="green">Activo</Badge>
                          : <Badge variant="neutral">Inactivo</Badge>
                        }
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit role */}
                          <a href={`/admin/usuarios?edit=${u.id}`} title="Editar rol">
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-3.5 w-3.5 text-zinc-500" />
                            </Button>
                          </a>
                          {/* Toggle status */}
                          <form action={toggleUserStatus}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="isActive" value={String(u.isActive)} />
                            <Button variant="ghost" size="sm" type="submit"
                              title={u.isActive ? "Desactivar" : "Activar"}>
                              {u.isActive
                                ? <UserX className="h-3.5 w-3.5 text-amber-500" />
                                : <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              }
                            </Button>
                          </form>
                          {/* Delete */}
                          <form action={deleteUser}>
                            <input type="hidden" name="userId" value={u.id} />
                            <Button variant="ghost" size="sm" type="submit" title="Eliminar">
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </form>
                        </div>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Editar rol ───────────────────────────────────── */}
      {editing && (
        <Card className="border-brand-blue/30 ring-2 ring-brand-blue/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
                <Pencil className="h-5 w-5 text-brand-blue" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle>Editando: {editing.name ?? editing.email}</CardTitle>
                <CardDescription>Cambia el rol asignado a este usuario</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change role */}
            <form action={updateUserRole} className="flex items-end gap-3">
              <input type="hidden" name="userId" value={editing.id} />
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Rol</label>
                <select name="roleKey" className={SELECT_CLS}
                  defaultValue={editing.roles[0]?.role.key ?? ""}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.key}>{r.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit">Guardar rol</Button>
              <a href="/admin/usuarios"><Button variant="secondary" type="button">Cancelar</Button></a>
            </form>

            {/* Reset password */}
            <div className="border-t border-zinc-100 pt-4">
              <p className="mb-3 text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-zinc-400" />
                Restablecer contraseña
              </p>
              <form action={resetPassword} className="flex items-end gap-3">
                <input type="hidden" name="userId" value={editing.id} />
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Nueva contraseña <span className="text-red-500">*</span></label>
                  <Input name="newPassword" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required />
                </div>
                <Button type="submit" variant="secondary">
                  <KeyRound className="h-4 w-4" />
                  Restablecer
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Crear nuevo usuario ──────────────────────────── */}
      <Card id="form-usuario">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <UserPlus className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle>Crear nuevo usuario</CardTitle>
              <CardDescription>El usuario podrá acceder al portal con su email y contraseña</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={createUser} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Nombre completo <span className="text-red-500">*</span></label>
              <Input name="name" placeholder="Ej: Vianney Guzmán" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Correo electrónico <span className="text-red-500">*</span></label>
              <Input name="email" type="email" placeholder="usuario@escuela.edu.do" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Contraseña <span className="text-red-500">*</span></label>
              <Input name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700">Rol <span className="text-red-500">*</span></label>
              <select name="roleKey" className={SELECT_CLS} required>
                <option value="">Selecciona un rol...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.key}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-zinc-700">
                Vincular con personal <span className="text-zinc-400 font-normal">(opcional)</span>
              </label>
              <select name="staffId" className={SELECT_CLS}>
                <option value="">Sin vincular</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName}, {s.firstName} — {s.type}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-400">Solo aparece el personal que aún no tiene usuario asignado.</p>
            </div>

            <div className="pt-1 md:col-span-2">
              <Button type="submit">
                <UserPlus className="h-4 w-4" />
                Crear usuario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Solo la Directora</span> puede crear y gestionar usuarios del portal.
          Comparte las credenciales de forma segura — la contraseña no se puede recuperar, solo restablecer.
        </p>
      </div>

    </div>
  );
}
