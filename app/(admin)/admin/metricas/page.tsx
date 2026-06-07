import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  BarChart3,
  CalendarDays,
  Gauge,
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

  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });
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
      where: {
        schoolYearId_month: { schoolYearId: activeYear.id, month },
      },
      update: data,
      create: { schoolYearId: activeYear.id, month, ...data },
    });
  }

  revalidatePath("/admin/metricas");
}

/* ── Helpers ────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/* ── Page ──────────────────────────────────────────────────── */

export default async function MetricasPage() {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "metrics:manage");

  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });

  // Manual metrics
  const snapshots = activeYear
    ? await prisma.metricSnapshot.findMany({
        where: { schoolYearId: activeYear.id },
        orderBy: [{ month: "asc" }],
      })
    : [];

  const annual = snapshots.find((s) => s.month === null);

  // ── Live stats from attendance data ──────────────────
  let totalStudents = 0;
  let totalAttendanceRecords = 0;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let attendanceRate: number | null = null;
  let activeAlerts = 0;
  let studentsWithdrawn = 0;

  if (activeYear) {
    totalStudents = await prisma.enrollment.count({
      where: { schoolYearId: activeYear.id, status: "ACTIVO" },
    });

    studentsWithdrawn = await prisma.enrollment.count({
      where: { schoolYearId: activeYear.id, status: "RETIRADO" },
    });

    // Attendance stats for this school year
    const enrollmentIds = (
      await prisma.enrollment.findMany({
        where: { schoolYearId: activeYear.id },
        select: { id: true },
      })
    ).map((e) => e.id);

    if (enrollmentIds.length > 0) {
      totalAttendanceRecords = await prisma.attendanceRecord.count({
        where: { enrollmentId: { in: enrollmentIds } },
      });

      totalPresent = await prisma.attendanceRecord.count({
        where: {
          enrollmentId: { in: enrollmentIds },
          status: "PRESENTE",
        },
      });

      totalAbsent = await prisma.attendanceRecord.count({
        where: {
          enrollmentId: { in: enrollmentIds },
          status: "AUSENTE",
        },
      });

      totalLate = await prisma.attendanceRecord.count({
        where: {
          enrollmentId: { in: enrollmentIds },
          status: "TARDE",
        },
      });

      if (totalAttendanceRecords > 0) {
        attendanceRate = Math.round(
          ((totalPresent + totalLate) / totalAttendanceRecords) * 100,
        );
      }
    }

    activeAlerts = await prisma.alert.count({
      where: { status: { in: ["ABIERTA", "EN_SEGUIMIENTO"] } },
    });
  }

  // Attendance by grade
  const grades = activeYear
    ? await prisma.grade.findMany({
        orderBy: { order: "asc" },
        include: {
          sections: {
            include: {
              enrollments: {
                where: {
                  schoolYearId: activeYear.id,
                  status: "ACTIVO",
                },
                select: { id: true },
              },
            },
          },
        },
      })
    : [];

  const gradeStats: {
    name: string;
    students: number;
    records: number;
    rate: number | null;
  }[] = [];

  for (const g of grades) {
    const eIds = g.sections.flatMap((s) => s.enrollments.map((e) => e.id));
    const students = eIds.length;
    if (students === 0) {
      gradeStats.push({ name: g.name, students: 0, records: 0, rate: null });
      continue;
    }

    const records = await prisma.attendanceRecord.count({
      where: { enrollmentId: { in: eIds } },
    });
    const present = await prisma.attendanceRecord.count({
      where: { enrollmentId: { in: eIds }, status: { in: ["PRESENTE", "TARDE"] } },
    });

    gradeStats.push({
      name: g.name,
      students,
      records,
      rate: records > 0 ? Math.round((present / records) * 100) : null,
    });
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Métricas"
        description={
          activeYear
            ? `Panel de indicadores — ${activeYear.label}`
            : "Sin año escolar activo"
        }
        icon={Gauge}
        iconBg="bg-rose-600"
        iconColor="text-white"
      />

      {/* ── KPIs en vivo (desde datos reales) ───────────── */}
      {activeYear && (
        <>
          <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            Indicadores en vivo
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-black/5 bg-white p-4 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-brand-blue" />
              <p className="text-2xl font-semibold text-brand-blue">
                {totalStudents}
              </p>
              <p className="text-sm font-medium text-zinc-600">
                Estudiantes activos
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
              <UserCheck className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
              <p className="text-2xl font-semibold text-emerald-700">
                {attendanceRate !== null ? `${attendanceRate}%` : "—"}
              </p>
              <p className="text-sm font-medium text-zinc-600">
                Tasa de asistencia
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-center">
              <TrendingDown className="mx-auto mb-1 h-5 w-5 text-red-600" />
              <p className="text-2xl font-semibold text-red-700">
                {totalAbsent}
              </p>
              <p className="text-sm font-medium text-zinc-600">
                Inasistencias totales
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-center">
              <CalendarDays className="mx-auto mb-1 h-5 w-5 text-amber-600" />
              <p className="text-2xl font-semibold text-amber-700">
                {totalLate}
              </p>
              <p className="text-sm font-medium text-zinc-600">Tardanzas totales</p>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-4 text-center">
              <BarChart3 className="mx-auto mb-1 h-5 w-5 text-brand-blue" />
              <p className="text-2xl font-semibold text-brand-blue">
                {activeAlerts}
              </p>
              <p className="text-sm font-medium text-zinc-600">Alertas activas</p>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-4 text-center">
              <TrendingDown className="mx-auto mb-1 h-5 w-5 text-zinc-400" />
              <p className="text-2xl font-semibold text-zinc-600">
                {studentsWithdrawn}
              </p>
              <p className="text-sm font-medium text-zinc-600">Retirados</p>
            </div>
          </div>
        </>
      )}

      {/* ── Asistencia por grado ─────────────────────────── */}
      {gradeStats.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            Asistencia por grado
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gradeStats.map((g) => (
              <div
                key={g.name}
                className="rounded-xl border border-black/5 bg-white p-4"
              >
                <p className="text-sm font-bold text-zinc-700">{g.name}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-bold ${
                      g.rate === null
                        ? "text-zinc-300"
                        : g.rate >= 90
                          ? "text-emerald-600"
                          : g.rate >= 75
                            ? "text-amber-600"
                            : "text-red-600"
                    }`}
                  >
                    {g.rate !== null ? `${g.rate}%` : "—"}
                  </span>
                  <span className="text-sm font-medium text-zinc-500">
                    {g.students} est.
                  </span>
                </div>
                {g.rate !== null && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100">
                    <div
                      className={`h-1.5 rounded-full ${
                        g.rate >= 90
                          ? "bg-emerald-500"
                          : g.rate >= 75
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${g.rate}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Métricas manuales (promoción, abandono, repitencia) ── */}
      <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
        Indicadores anuales (registro manual)
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-black/5 bg-white p-5 text-center">
          <p className="text-3xl font-semibold text-brand-blue">
            {annual?.promotionRate != null ? `${annual.promotionRate}%` : "—"}
          </p>
          <p className="text-sm font-semibold text-zinc-600">Promoción</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white p-5 text-center">
          <p className="text-3xl font-semibold text-red-600">
            {annual?.dropoutRate != null ? `${annual.dropoutRate}%` : "—"}
          </p>
          <p className="text-sm font-semibold text-zinc-600">Abandono</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white p-5 text-center">
          <p className="text-3xl font-semibold text-amber-600">
            {annual?.repetitionRate != null
              ? `${annual.repetitionRate}%`
              : "—"}
          </p>
          <p className="text-sm font-semibold text-zinc-600">Repitencia</p>
        </div>
      </div>

      {/* ── Formulario de registro manual ────────────────── */}
      {canManage && (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black">
            <span className="transition-transform group-open:rotate-90">
              &#9654;
            </span>
            Registrar / actualizar métricas manualmente
          </summary>
          <Card className="mt-3">
            <CardContent className="pt-6">
              <form
                action={upsertMetrics}
                className="grid gap-4 md:grid-cols-2"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Mes (1-12)</label>
                  <select
                    name="month"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
                  >
                    <option value="">Anual (todo el año)</option>
                    {MONTH_NAMES.slice(1).map((m, i) => (
                      <option key={i + 1} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Promoción %</label>
                  <Input name="promotionRate" placeholder="92.5" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Abandono %</label>
                  <Input name="dropoutRate" placeholder="1.2" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Repitencia %</label>
                  <Input name="repetitionRate" placeholder="0.8" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-zinc-700">Notas</label>
                  <Input name="notes" placeholder="(opcional)" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Guardar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </details>
      )}

      {!canManage && (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <span className="mt-0.5 text-sm">🔒</span>
          <p className="text-sm text-zinc-600">Tu rol permite ver métricas, pero no registrar/editar.</p>
        </div>
      )}

      {/* ── Historial mensual ───────────────────────────── */}
      {snapshots.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            Historial de métricas
          </h3>
          <Card>
            <CardContent className="p-0">
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
                      <TD className="font-medium">
                        {s.month
                          ? MONTH_NAMES[s.month] || `Mes ${s.month}`
                          : "Anual"}
                      </TD>
                      <TD>
                        {s.promotionRate != null ? (
                          <Badge variant="green">{s.promotionRate}%</Badge>
                        ) : (
                          "—"
                        )}
                      </TD>
                      <TD>
                        {s.dropoutRate != null ? (
                          <Badge variant="red">{s.dropoutRate}%</Badge>
                        ) : (
                          "—"
                        )}
                      </TD>
                      <TD>
                        {s.repetitionRate != null ? (
                          <Badge variant="yellow">{s.repetitionRate}%</Badge>
                        ) : (
                          "—"
                        )}
                      </TD>
                      <TD className="text-sm text-zinc-600">
                        {s.notes ?? "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
