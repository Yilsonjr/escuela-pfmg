import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  Search,
  FileText,
  ExternalLink,
  Trash2,
  BookOpen,
  ScrollText,
  FileCheck,
  FolderOpen,
} from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ModuleHeader } from "@/components/ui/module-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

/* ── Server Actions ─────────────────────────────────────────── */

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

async function deleteDocument(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.document.delete({ where: { id } });
  revalidatePath("/admin/documentos");
}

/* ── Helpers ────────────────────────────────────────────────── */

const CATEGORY_CONFIG: Record<
  string,
  { label: string; variant: "blue" | "yellow" | "green" | "red" | "neutral" }
> = {
  CIRCULAR: { label: "Circular", variant: "blue" },
  ACTA: { label: "Acta", variant: "yellow" },
  FORMATO: { label: "Formato", variant: "green" },
  MANUAL: { label: "Manual", variant: "red" },
  OTRO: { label: "Otro", variant: "neutral" },
};

/* ── Page ──────────────────────────────────────────────────── */

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await requireAuth();
  const canManage = hasPermission(
    session.user?.permissions,
    "documents:manage",
  );
  const params = await searchParams;
  const query = params.q || "";
  const filterCategory = params.category || "";

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  if (filterCategory) {
    where.category = filterCategory;
  }

  const [docs, totalDocs] = await Promise.all([
    prisma.document.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.document.count(),
  ]);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Documentos"
        description={`${totalDocs} documento${totalDocs !== 1 ? "s" : ""} en el repositorio`}
        icon={FileText}
        iconBg="bg-sky-600"
        iconColor="text-white"
      />

      {/* ── Formulario ──────────────────────────────────── */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Agregar documento</CardTitle>
            <CardDescription>
              Enlace a Google Drive, SharePoint o cualquier URL accesible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createDocument}
              className="grid gap-4 md:grid-cols-2"
            >
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-700">Título</label>
                <Input
                  name="title"
                  placeholder="Circular: Horario de clases 2025-2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Categoría</label>
                <select
                  name="category"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
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
                <label className="text-sm font-semibold text-zinc-700">URL</label>
                <Input
                  name="url"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-700">Descripción</label>
                <Input
                  name="description"
                  placeholder="Breve descripción (opcional)"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!canManage && (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <span className="mt-0.5 text-sm">🔒</span>
          <p className="text-sm text-zinc-600">Tu rol permite ver documentos, pero no agregar ni eliminar.</p>
        </div>
      )}

      {/* ── Búsqueda y filtros ──────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          action="/admin/documentos"
          method="GET"
          className="relative flex-1"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            type="search"
            placeholder="Buscar documentos..."
            defaultValue={query}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
          />
          {filterCategory && (
            <input type="hidden" name="category" value={filterCategory} />
          )}
        </form>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/documentos">
            <Button
              variant={!filterCategory ? "primary" : "secondary"}
              size="sm"
            >
              Todos
            </Button>
          </a>
          {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
            <a
              key={key}
              href={`/admin/documentos?category=${key}${query ? `&q=${query}` : ""}`}
            >
              <Button
                variant={filterCategory === key ? "primary" : "secondary"}
                size="sm"
              >
                {label}
              </Button>
            </a>
          ))}
        </div>
      </div>

      {/* ── Tabla ───────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Título</TH>
                <TH>Categoría</TH>
                <TH>Descripción</TH>
                <TH>Fecha</TH>
                <TH className="text-right">Enlace</TH>
                {canManage && <TH className="text-right">Acciones</TH>}
              </TR>
            </THead>
            <TBody>
              {docs.length === 0 ? (
                <TR>
                  <TD
                    colSpan={canManage ? 6 : 5}
                    className="py-12 text-center text-zinc-600"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen className="h-8 w-8 text-zinc-300" />
                      {query || filterCategory ? (
                        <p>No se encontraron documentos con esos filtros.</p>
                      ) : (
                        <p>No hay documentos. Agrega el primero arriba.</p>
                      )}
                    </div>
                  </TD>
                </TR>
              ) : (
                docs.map((d) => {
                  const cat = CATEGORY_CONFIG[d.category] ??
                    CATEGORY_CONFIG.OTRO;
                  return (
                    <TR key={d.id}>
                      <TD className="font-medium">{d.title}</TD>
                      <TD>
                        <Badge variant={cat.variant}>{cat.label}</Badge>
                      </TD>
                      <TD className="max-w-xs text-sm text-zinc-600">
                        {d.description || "—"}
                      </TD>
                      <TD className="text-sm text-zinc-500">
                        {new Intl.DateTimeFormat("es-DO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(d.createdAt)}
                      </TD>
                      <TD className="text-right">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"
                        >
                          Abrir
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TD>
                      {canManage && (
                        <TD className="text-right">
                          <form action={deleteDocument}>
                            <input type="hidden" name="id" value={d.id} />
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </form>
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
        Mostrando {docs.length} de {totalDocs} documentos
      </p>
    </div>
  );
}
