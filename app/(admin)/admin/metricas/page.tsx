import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const metricsSchema = z.object({
  month: z.string().optional().or(z.literal("")),
  promotionRate: z.string().optional().or(z.literal("")),
  dropoutRate: z.string().optional().or(z.literal("")),
  repetitionRate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

function toFloatOrNull(value: string | undefined) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function upsertMetrics(formData: FormData) {
  "use server";
  const parsed = metricsSchema.safeParse({
    month: formData.get("month"),
    promotionRate: formData.get("promotionRate"),
    dropoutRate: formData.get("dropoutRate"),
    repetitionRate: formData.get("repetitionRate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return;

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return;

  const month = parsed.data.month ? Number(parsed.data.month) : null;
  const data = {
    promotionRate: toFloatOrNull(parsed.data.promotionRate),
    dropoutRate: toFloatOrNull(parsed.data.dropoutRate),
    repetitionRate: toFloatOrNull(parsed.data.repetitionRate),
    notes: parsed.data.notes || null,
  };

  if (month == null) {
    const existing = await prisma.metricSnapshot.findFirst({
      where: { schoolYearId: activeYear.id, month: null },
    });
    if (existing) {
      await prisma.metricSnapshot.update({ where: { id: existing.id }, data });
    } else {
      await prisma.metricSnapshot.create({
        data: { schoolYearId: activeYear.id, month: null, ...data },
      });
    }
  } else {
    await prisma.metricSnapshot.upsert({
      where: { schoolYearId_month: { schoolYearId: activeYear.id, month } },
      update: data,
      create: { schoolYearId: activeYear.id, month, ...data },
    });
  }

  revalidatePath("/admin/metricas");
}

export default async function MetricasPage() {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "metrics:manage");

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  const snapshots = activeYear
    ? await prisma.metricSnapshot.findMany({
        where: { schoolYearId: activeYear.id },
        orderBy: [{ month: "asc" }],
      })
    : [];

  const annual = snapshots.find((s) => s.month === null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Métricas"
        description="Promoción, abandono y repitencia (mensual y anual)."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Promoción (anual)"
          value={annual?.promotionRate != null ? `${annual.promotionRate}%` : "—"}
        />
        <KpiCard
          label="Abandono (anual)"
          value={annual?.dropoutRate != null ? `${annual.dropoutRate}%` : "—"}
        />
        <KpiCard
          label="Repitencia (anual)"
          value={annual?.repetitionRate != null ? `${annual.repetitionRate}%` : "—"}
        />
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Registrar / actualizar</CardTitle>
            <CardDescription>
              Mes vacío = anual. Valores en porcentaje (ej. 92.5).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertMetrics} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mes (1-12) o vacío</label>
                <Input name="month" placeholder="(vacío = anual)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Promoción %</label>
                <Input name="promotionRate" placeholder="92.5" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Abandono %</label>
                <Input name="dropoutRate" placeholder="1.2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Repitencia %</label>
                <Input name="repetitionRate" placeholder="0.8" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Notas</label>
                <Input name="notes" placeholder="(opcional)" />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          Tu rol permite ver métricas, pero no registrar/editar.
        </div>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Periodo</TH>
            <TH>Promoción</TH>
            <TH>Abandono</TH>
            <TH>Repitencia</TH>
            <TH>Notas</TH>
          </TR>
        </THead>
        <TBody>
          {snapshots.map((s) => (
            <TR key={s.id}>
              <TD className="font-medium">{s.month ? `Mes ${s.month}` : "Anual"}</TD>
              <TD className="text-muted-foreground">{s.promotionRate != null ? `${s.promotionRate}%` : "—"}</TD>
              <TD className="text-muted-foreground">{s.dropoutRate != null ? `${s.dropoutRate}%` : "—"}</TD>
              <TD className="text-muted-foreground">{s.repetitionRate != null ? `${s.repetitionRate}%` : "—"}</TD>
              <TD className="text-muted-foreground">{s.notes ?? "—"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

