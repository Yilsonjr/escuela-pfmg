import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  Search, Pencil, Trash2, UserCheck, UserX,
  Users, GraduationCap, HeartPulse, Wrench, ShieldAlert,
  UserPlus,
} from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

/* ── Constants ─────────────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  DOCENTE: "Docente",
  ADMINISTRATIVO: "Administrativo",
  PSICOLOGIA: "Psicología",
  APOYO: "Apoyo",
};

const TYPE_STYLES = {
  DOCENTE:       { icon: GraduationCap, bg: "bg-brand-blue/10",  color: "text-brand-blue",  badge: "blue"    as const },
  ADMINISTRATIVO:{ icon: Users,          bg: "bg-amber-100",       color: "text-amber-700",  badge: "yellow"  as const },
  PSICOLOGIA:    { icon: HeartPulse,     bg: "bg-emerald-100",     color: "text-emerald-700",badge: "green"   as const },
  APOYO:         { icon: Wrench,         bg: "bg-zinc-100",        color: "text-zinc-600",   badge: "neutral" as const },
};

/* ── Schema ────────────────────────────────────────────────── */

const staffSchema = z.object({
  firstName: z.string().min(2),
  lastName:  z.string().min(2),
  type:      z.enum(["DOCENTE", "ADMINISTRATIVO", "PSICOLOGIA", "APOYO"]),
  email:     z.string().email().optional().or(z.literal("")),
  phone:     z.string().optional().or(z.literal("")),
});

function parseForm(fd: FormData) {
  return staffSchema.safeParse({
    firstName: fd.get("firstName"),
    lastName:  fd.get("lastName"),
    type:      fd.get("type"),
    email:     fd.get("email"),
    phone:     fd.get("phone"),
  });
}

/* ── Server Actions ────────────────────────────────────────── */

async function createStaff(fd: FormData) {
  "use server";
  const p = parseForm(fd);
  if (!p.success) return;
  await prisma.staff.create({
    data: { firstName: p.data.firstName, lastName: p.data.lastName, type: p.data.type, email: p.data.email || null, phone: p.data.phone || null },
  });
  revalidatePath("/admin/personal");
}

async function updateStaff(fd: FormData) {
  "use server";
  const id = fd.get("id") as string;
  if (!id) return;
  const p = parseForm(fd);
  if (!p.success) return;
  await prisma.staff.update({
    where: { id },
    data: { firstName: p.data.firstName, lastName: p.data.lastName, type: p.data.type, email: p.data.email || null, phone: p.data.phone || null },
  });
  revalidatePath("/admin/personal");
  redirect("/admin/personal");
}

async function toggleStaffStatus(fd: FormData) {
  "use server";
  const id = fd.get("id") as string;
  const cur = fd.get("isActive") === "true";
  if (!id) return;
  await prisma.staff.update({ where: { id }, data: { isActive: !cur } });
  revalidatePath("/admin/personal");
}

async function deleteStaff(fd: FormData) {
  "use server";
  const id = fd.get("id") as string;
  if (!id) return;
  await prisma.staff.delete({ where: { id } });
  revalidatePath("/admin/personal");
}

/* ── Helpers ───────────────────────────────────────────────── */

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-brand-blue/15 text-brand-blue",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
];

function avatarColor(name: string) {
  let n = 0;
  for (const c of name) n += c.charCodeAt(0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

/* ── Shared select class ───────────────────────────────────── */
const SELECT_CLS = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none hover:border-zinc-300 focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10 cursor-pointer";
const SEARCH_CLS = "h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none hover:border-zinc-300 focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10";

/* ── Page ──────────────────────────────────────────────────── */

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string; type?: string }>;
}) {
  const session  = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "staff:manage");
  const params   = await searchParams;
  const query      = params.q      || "";
  const filterType = params.type   || "";
  const editId     = params.edit   || "";

  const staff = await prisma.staff.findMany({
    where: {
      AND: [
        query ? { OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName:  { contains: query, mode: "insensitive" } },
          { email:     { contains: query, mode: "insensitive" } },
        ]} : {},
        filterType ? { type: filterType as never } : {},
      ],
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const [editing, totalCount, activeCount, allStaff] = await Promise.all([
    editId ? prisma.staff.findUnique({ where: { id: editId } }) : Promise.resolve(null),
    prisma.staff.count(),
    prisma.staff.count({ where: { isActive: true } }),
    prisma.staff.findMany({ select: { type: true } }),
  ]);

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <PageHeader
        title="Personal"
        description={`${totalCount} registros · ${activeCount} activos`}
        actions={
          canManage ? (
            <a href="#form-personal">
              <Button size="sm">
                <UserPlus className="h-4 w-4" />
                Agregar personal
              </Button>
            </a>
          ) : undefined
        }
      />

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["DOCENTE","ADMINISTRATIVO","PSICOLOGIA","APOYO"] as const).map((type) => {
          const count = allStaff.filter((s) => s.type === type).length;
          const style = TYPE_STYLES[type];
          const Icon  = style.icon;
          return (
            <a
              key={type}
              href={`/admin/personal?type=${type}${query ? `&q=${query}` : ""}`}
              className={`group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:shadow-md ${
                filterType === type
                  ? "border-brand-blue/30 bg-brand-blue/5 shadow-sm"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                <Icon className={`h-5 w-5 ${style.color}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-zinc-800">{count}</p>
                <p className="text-xs font-semibold text-zinc-500">{TYPE_LABELS[type]}</p>
              </div>
            </a>
          );
        })}
      </div>

      {/* ── Formulario ──────────────────────────────────── */}
      {canManage && (
        <Card id="form-personal" className={editing ? "border-brand-blue/30 ring-2 ring-brand-blue/10" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${editing ? "bg-amber-100" : "bg-brand-blue/10"}`}>
                {editing
                  ? <Pencil className="h-5 w-5 text-amber-600" />
                  : <UserPlus className="h-5 w-5 text-brand-blue" />
                }
              </div>
              <div>
                <CardTitle>
                  {editing ? `Editando: ${editing.firstName} ${editing.lastName}` : "Agregar personal"}
                </CardTitle>
                <CardDescription>
                  {editing ? "Modifica los datos y guarda los cambios." : "Registra un nuevo miembro del personal del centro."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={editing ? updateStaff : createStaff} className="grid gap-4 md:grid-cols-2">
              {editing && <input type="hidden" name="id" value={editing.id} />}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Nombres <span className="text-red-500">*</span></label>
                <Input name="firstName" placeholder="Ej: Vianney" required defaultValue={editing?.firstName ?? ""} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Apellidos <span className="text-red-500">*</span></label>
                <Input name="lastName" placeholder="Ej: Guzmán" required defaultValue={editing?.lastName ?? ""} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Tipo de personal <span className="text-red-500">*</span></label>
                <select name="type" className={SELECT_CLS} required defaultValue={editing?.type ?? "DOCENTE"}>
                  <option value="DOCENTE">Docente</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="PSICOLOGIA">Psicología</option>
                  <option value="APOYO">Personal de apoyo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Teléfono</label>
                <Input name="phone" placeholder="(809) 555-1234" defaultValue={editing?.phone ?? ""} />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-700">Correo electrónico</label>
                <Input name="email" type="email" placeholder="nombre@escuela.edu.do" defaultValue={editing?.email ?? ""} />
              </div>

              <div className="flex gap-3 pt-1 md:col-span-2">
                <Button type="submit">
                  {editing ? "Guardar cambios" : "Agregar al personal"}
                </Button>
                {editing && (
                  <a href="/admin/personal">
                    <Button type="button" variant="secondary">Cancelar</Button>
                  </a>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!canManage && (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <p className="text-sm text-zinc-600">Tu rol permite ver el personal, pero no crear ni editar registros.</p>
        </div>
      )}

      {/* ── Búsqueda y filtros ───────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/admin/personal" method="GET" className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            type="search"
            placeholder="Buscar por nombre o email..."
            defaultValue={query}
            className={SEARCH_CLS}
          />
          {filterType && <input type="hidden" name="type" value={filterType} />}
        </form>

        <div className="flex flex-wrap gap-2">
          {[{ key: "", label: "Todos" }, ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ key: k, label: v }))].map(
            ({ key, label }) => (
              <a key={key} href={`/admin/personal${key ? `?type=${key}` : ""}${key && query ? `&q=${query}` : !key && query ? `?q=${query}` : ""}`}>
                <Button variant={filterType === key || (!filterType && key === "") ? "primary" : "secondary"} size="sm">
                  {label}
                </Button>
              </a>
            )
          )}
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Nombre</TH>
                <TH>Tipo</TH>
                <TH>Email</TH>
                <TH>Teléfono</TH>
                <TH>Estado</TH>
                {canManage && <TH className="text-right">Acciones</TH>}
              </TR>
            </THead>
            <TBody>
              {staff.length === 0 ? (
                <TR>
                  <TD colSpan={canManage ? 6 : 5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                        <Users className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-700">
                        {query || filterType ? "No se encontraron resultados" : "No hay personal registrado"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {query || filterType ? "Intenta con otros términos de búsqueda" : "Usa el formulario de arriba para agregar el primero"}
                      </p>
                    </div>
                  </TD>
                </TR>
              ) : (
                staff.map((s) => {
                  const style = TYPE_STYLES[s.type] ?? TYPE_STYLES.APOYO;
                  return (
                    <TR key={s.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(s.firstName + s.lastName)}`}>
                            {initials(s.firstName, s.lastName)}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-800">{s.lastName}, {s.firstName}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge variant={style.badge}>{TYPE_LABELS[s.type] ?? s.type}</Badge>
                      </TD>
                      <TD className="text-zinc-600">{s.email ?? <span className="text-zinc-300">—</span>}</TD>
                      <TD className="text-zinc-600">{s.phone ?? <span className="text-zinc-300">—</span>}</TD>
                      <TD>
                        {s.isActive
                          ? <Badge variant="green">Activo</Badge>
                          : <Badge variant="neutral">Inactivo</Badge>
                        }
                      </TD>
                      {canManage && (
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a href={`/admin/personal?edit=${s.id}`} title="Editar">
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-3.5 w-3.5 text-zinc-500" />
                              </Button>
                            </a>
                            <form action={toggleStaffStatus}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="isActive" value={String(s.isActive)} />
                              <Button variant="ghost" size="sm" type="submit" title={s.isActive ? "Desactivar" : "Activar"}>
                                {s.isActive
                                  ? <UserX className="h-3.5 w-3.5 text-amber-500" />
                                  : <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                }
                              </Button>
                            </form>
                            <form action={deleteStaff}>
                              <input type="hidden" name="id" value={s.id} />
                              <Button variant="ghost" size="sm" type="submit" title="Eliminar">
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                              </Button>
                            </form>
                          </div>
                        </TD>
                      )}
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-zinc-500">
        Mostrando <span className="font-semibold text-zinc-700">{staff.length}</span> de <span className="font-semibold text-zinc-700">{totalCount}</span> registros
      </p>

    </div>
  );
}
