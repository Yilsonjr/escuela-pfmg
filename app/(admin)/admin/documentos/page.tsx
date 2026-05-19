import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const docSchema = z.object({
  title: z.string().min(3),
  category: z.enum(["CIRCULAR", "ACTA", "FORMATO", "MANUAL", "OTRO"]),
  url: z.string().url(),
  description: z.string().optional().or(z.literal("")),
});

async function createDocument(formData: FormData) {
  "use server";
  const parsed = docSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    url: formData.get("url"),
    description: formData.get("description"),
  });
  if (!parsed.success) return;

  await prisma.document.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      url: parsed.data.url,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/admin/documentos");
}

export default async function DocumentosPage() {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "documents:manage");

  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos internos"
        description="Repositorio de enlaces/archivos internos (MVP: por URL)."
      />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Agregar documento</CardTitle>
            <CardDescription>
              Para MVP, guarda un enlace (Drive/SharePoint/intranet). Luego se integra almacenamiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDocument} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Título</label>
                <Input name="title" placeholder="Circular: horario" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <select
                  name="category"
                  className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
                  defaultValue="OTRO"
                >
                  <option value="CIRCULAR">Circular</option>
                  <option value="ACTA">Acta</option>
                  <option value="FORMATO">Formato</option>
                  <option value="MANUAL">Manual</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input name="url" placeholder="https://..." required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input name="description" placeholder="(opcional)" />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          Tu rol permite ver documentos, pero no gestionar el repositorio.
        </div>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Título</TH>
            <TH>Categoría</TH>
            <TH>Enlace</TH>
            <TH>Creado</TH>
          </TR>
        </THead>
        <TBody>
          {docs.map((d) => (
            <TR key={d.id}>
              <TD className="font-medium">{d.title}</TD>
              <TD className="text-muted-foreground">{d.category}</TD>
              <TD>
                <a className="text-brand-blue hover:underline" href={d.url} target="_blank" rel="noreferrer">
                  Abrir
                </a>
              </TD>
              <TD className="text-muted-foreground">
                {new Intl.DateTimeFormat("es-DO").format(d.createdAt)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

