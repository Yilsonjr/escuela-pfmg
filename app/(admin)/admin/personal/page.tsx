import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const staffSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  type: z.enum(["DOCENTE", "ADMINISTRATIVO", "PSICOLOGIA", "APOYO"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

async function createStaff(formData: FormData) {
  "use server";
  const parsed = staffSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    type: formData.get("type"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return;

  await prisma.staff.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      type: parsed.data.type,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath("/admin/personal");
}

export default async function PersonalPage() {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "staff:manage");

  const staff = await prisma.staff.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal"
        description="Registro de docentes, administrativos, psicología y apoyo."
        actions={
          canManage ? (
            <a className="text-sm text-muted-foreground" href="/admin">
              Volver al dashboard
            </a>
          ) : undefined
        }
      />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Agregar personal</CardTitle>
            <CardDescription>Usa datos reales del centro (ej. Vianney Guzmán).</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createStaff} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombres</label>
                <Input name="firstName" placeholder="Vianney" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apellidos</label>
                <Input name="lastName" placeholder="Guzmán" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  name="type"
                  className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
                  required
                  defaultValue="DOCENTE"
                >
                  <option value="DOCENTE">Docente</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="PSICOLOGIA">Psicología</option>
                  <option value="APOYO">Apoyo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input name="phone" placeholder="(opcional)" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" placeholder="(opcional)" />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          Tu rol permite ver el personal, pero no crear/editar.
        </div>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Nombre</TH>
            <TH>Tipo</TH>
            <TH>Email</TH>
            <TH>Teléfono</TH>
            <TH>Estado</TH>
          </TR>
        </THead>
        <TBody>
          {staff.map((s) => (
            <TR key={s.id}>
              <TD className="font-medium">
                {s.lastName}, {s.firstName}
              </TD>
              <TD>{s.type}</TD>
              <TD className="text-muted-foreground">{s.email ?? "—"}</TD>
              <TD className="text-muted-foreground">{s.phone ?? "—"}</TD>
              <TD>{s.isActive ? <Badge variant="green">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

