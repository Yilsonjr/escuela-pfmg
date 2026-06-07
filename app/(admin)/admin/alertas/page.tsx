import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Eye,
  CheckCircle2,
  RotateCcw,
  Bell,
} from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { weekStartMonday } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModuleHeader } from "@/components/ui/module-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

/* ── Server Actions ─────────────────────────────────────────── */

async function generateWeeklyRiskAndAlerts() {
  "use server";
  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });
  if (!activeYear) return;

  const now = new Date();
  const weekStart = weekStartMonday(now);
  const weekEnd = addDays(weekStart, 7);

  const enrollments = await prisma.enrollment.findMany({
    where: { schoolYearId: activeYear.id, status: "ACTIVO" },
    include: {
      student: true,
      section: { include: { grade: true } },
    },
  });

  const absences = await prisma.attendanceRecord.groupBy({
    by: ["enrollmentId"],
    where: {
      enrollmentId: { in: enrollments.map((e: { id: string }) => e.id) },
      status: "AUSENTE",
      date: { gte: weekStart, lt: weekEnd },
    },
    _count: { _all: true },
  });
  const absByEnrollment = new Map(
    absences.map((a) => [a.enrollmentId, a._count._all]),
  );

  // Find psicología staff to auto-assign
  const psicologia = await prisma.staff.findFirst({
    where: { type: "PSICOLOGIA", isActive: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  for (const e of enrollments) {
    const count = absByEnrollment.get(e.id) ?? 0;
    const severity =
      count >= 3 ? "ROJO" : count >= 2 ? "AMARILLO" : "VERDE";

    // Save weekly risk snapshot
    await prisma.studentRiskSnapshot.upsert({
      where: {
        enrollmentId_weekStart: { enrollmentId: e.id, weekStart },
      },
      update: { absences: count, severity, schoolYearId: activeYear.id },
      create: {
        enrollmentId: e.id,
        schoolYearId: activeYear.id,
        weekStart,
        absences: count,
        severity,
      },
    });

    // Only create alerts for AMARILLO and ROJO
    if (severity === "VERDE") continue;

    // Check if alert already exists for this week
    const existing = await prisma.alert.findFirst({
      where: {
        enrollmentId: e.id,
        severity,
        createdAt: { gte: weekStart, lt: weekEnd },
        status: { in: ["ABIERTA", "EN_SEGUIMIENTO"] },
      },
    });
    if (existing) continue;

    const sectionLabel = `${e.section.grade.name} ${e.section.letter}`;
    await prisma.alert.create({
      data: {
        severity,
        title:
          severity === "ROJO"
            ? "Riesgo de abandono"
            : "Patrón de inasistencia",
        details:
          severity === "ROJO"
            ? `${e.student.lastName}, ${e.student.firstName} (${sectionLabel}) acumula ${count} inasistencias esta semana. Requiere intervención inmediata.`
            : `${e.student.lastName}, ${e.student.firstName} (${sectionLabel}) tiene ${count} inasistencias esta semana. Monitorear.`,
        studentId: e.studentId,
        enrollmentId: e.id,
        assignedStaffId: psicologia?.id ?? null,
      },
    });
  }

  revalidatePath("/admin/alertas");
}

async function updateAlertStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("alertId") ?? "");
  const newStatus = String(formData.get("newStatus") ?? "");
  if (!id || !newStatus) return;

  const validStatuses = ["ABIERTA", "EN_SEGUIMIENTO", "CERRADA"] as const;
  if (!validStatuses.includes(newStatus as (typeof validStatuses)[number]))
    return;

  await prisma.alert.update({
    where: { id },
    data: { status: newStatus as "ABIERTA" | "EN_SEGUIMIENTO" | "CERRADA" },
  });

  revalidatePath("/admin/alertas");
}

/* ── Page ──────────────────────────────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  ABIERTA: "Abierta",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADA: "Cerrada",
};

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<{
    severity?: string;
    status?: string;
    grade?: string;
  }>;
}) {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "alerts:manage");
  const params = await searchParams;

  const filterSeverity = params.severity || "";
  const filterStatus = params.status || "";
  const filterGrade = params.grade || "";

  // Build query
  const where: Record<string, unknown> = {};
  if (filterSeverity) where.severity = filterSeverity;
  if (filterStatus) {
    where.status = filterStatus;
  } else {
    // Default: show open and in-progress, not closed
    where.status = { in: ["ABIERTA", "EN_SEGUIMIENTO"] };
  }
  if (filterGrade) {
    where.enrollment = {
      section: { grade: { code: filterGrade } },
    };
  }

  const alerts = await prisma.alert.findMany({
    where,
    include: {
      student: true,
      enrollment: { include: { section: { include: { grade: true } } } },
      assignedStaff: true,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });

  // Stats
  const totalOpen = await prisma.alert.count({
    where: { status: "ABIERTA" },
  });
  const totalFollowUp = await prisma.alert.count({
    where: { status: "EN_SEGUIMIENTO" },
  });
  const totalRojo = await prisma.alert.count({
    where: { severity: "ROJO", status: { in: ["ABIERTA", "EN_SEGUIMIENTO"] } },
  });
  const totalAmarillo = await prisma.alert.count({
    where: {
      severity: "AMARILLO",
      status: { in: ["ABIERTA", "EN_SEGUIMIENTO"] },
    },
  });

  // Grades for filter
  const grades = await prisma.grade.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Alertas"
        description="Sistema de alerta temprana por inasistencias."
        icon={Bell}
        iconBg="bg-amber-500"
        iconColor="text-white"
        actions={
          canManage ? (
            <form action={generateWeeklyRiskAndAlerts}>
              <Button type="submit" className="gap-2">
                <Bell className="h-4 w-4" />
                Generar alertas (semana)
              </Button>
            </form>
          ) : undefined
        }
      />

      {/* ── Resumen ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a href="/admin/alertas?severity=ROJO">
          <div
            className={`rounded-xl border p-4 transition-colors hover:border-red-300 ${filterSeverity === "ROJO" ? "border-red-300 bg-red-50" : "border-red-100 bg-red-50/50"}`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-semibold text-red-700">
                {totalRojo}
              </span>
            </div>
            <p className="text-sm font-semibold text-red-700">Riesgo alto</p>
          </div>
        </a>
        <a href="/admin/alertas?severity=AMARILLO">
          <div
            className={`rounded-xl border p-4 transition-colors hover:border-amber-300 ${filterSeverity === "AMARILLO" ? "border-amber-300 bg-amber-50" : "border-amber-100 bg-amber-50/50"}`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-2xl font-semibold text-amber-700">
                {totalAmarillo}
              </span>
            </div>
            <p className="text-sm font-semibold text-amber-700">Atención</p>
          </div>
        </a>
        <a href="/admin/alertas?status=ABIERTA">
          <div
            className={`rounded-xl border p-4 transition-colors hover:border-brand-blue/30 ${filterStatus === "ABIERTA" ? "border-brand-blue/30 bg-brand-blue/5" : "border-black/5 bg-white"}`}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-brand-blue" />
              <span className="text-2xl font-semibold text-brand-blue">
                {totalOpen}
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-600">Abiertas</p>
          </div>
        </a>
        <a href="/admin/alertas?status=EN_SEGUIMIENTO">
          <div
            className={`rounded-xl border p-4 transition-colors hover:border-brand-blue/30 ${filterStatus === "EN_SEGUIMIENTO" ? "border-brand-blue/30 bg-brand-blue/5" : "border-black/5 bg-white"}`}
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-brand-blue" />
              <span className="text-2xl font-semibold text-brand-blue">
                {totalFollowUp}
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-600">En seguimiento</p>
          </div>
        </a>
      </div>

      {/* ── Filtros ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <a href="/admin/alertas">
          <Button
            variant={
              !filterSeverity && !filterStatus && !filterGrade
                ? "primary"
                : "secondary"
            }
            size="sm"
          >
            Activas
          </Button>
        </a>
        <a href="/admin/alertas?status=CERRADA">
          <Button
            variant={filterStatus === "CERRADA" ? "primary" : "secondary"}
            size="sm"
          >
            Cerradas
          </Button>
        </a>

        <span className="mx-1 self-center text-zinc-300">|</span>

        {grades.map((g) => (
          <a
            key={g.code}
            href={`/admin/alertas?grade=${g.code}${filterSeverity ? `&severity=${filterSeverity}` : ""}${filterStatus ? `&status=${filterStatus}` : ""}`}
          >
            <Button
              variant={filterGrade === g.code ? "primary" : "secondary"}
              size="sm"
            >
              {g.name}
            </Button>
          </a>
        ))}
      </div>

      {/* ── Tabla de alertas ────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Severidad</TH>
                <TH>Estudiante</TH>
                <TH>Sección</TH>
                <TH>Detalle</TH>
                <TH>Asignado a</TH>
                <TH>Estado</TH>
                <TH>Fecha</TH>
                {canManage && <TH className="text-right">Acciones</TH>}
              </TR>
            </THead>
            <TBody>
              {alerts.length === 0 ? (
                <TR>
                  <TD
                    colSpan={canManage ? 8 : 7}
                    className="py-12 text-center text-zinc-600"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="h-8 w-8 text-emerald-300" />
                      {filterSeverity || filterStatus || filterGrade ? (
                        <p>No hay alertas con esos filtros.</p>
                      ) : (
                        <p>
                          No hay alertas activas. Pulsa &quot;Generar
                          alertas&quot; para analizar la semana.
                        </p>
                      )}
                    </div>
                  </TD>
                </TR>
              ) : (
                alerts.map((a) => (
                  <TR key={a.id}>
                    <TD>
                      {a.severity === "ROJO" ? (
                        <Badge variant="red">Rojo</Badge>
                      ) : a.severity === "AMARILLO" ? (
                        <Badge variant="yellow">Amarillo</Badge>
                      ) : (
                        <Badge variant="green">Verde</Badge>
                      )}
                    </TD>
                    <TD className="font-medium">
                      {a.student
                        ? `${a.student.lastName}, ${a.student.firstName}`
                        : "—"}
                    </TD>
                    <TD className="text-zinc-600">
                      {a.enrollment
                        ? `${a.enrollment.section.grade.name} ${a.enrollment.section.letter}`
                        : "—"}
                    </TD>
                    <TD className="max-w-xs text-sm text-zinc-600">
                      {a.details || a.title}
                    </TD>
                    <TD className="text-zinc-600">
                      {a.assignedStaff
                        ? `${a.assignedStaff.firstName} ${a.assignedStaff.lastName}`
                        : "Sin asignar"}
                    </TD>
                    <TD>
                      <Badge
                        variant={
                          a.status === "ABIERTA"
                            ? "red"
                            : a.status === "EN_SEGUIMIENTO"
                              ? "yellow"
                              : "green"
                        }
                      >
                        {STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </TD>
                    <TD className="text-sm text-zinc-500">
                      {new Intl.DateTimeFormat("es-DO", {
                        day: "2-digit",
                        month: "short",
                      }).format(a.createdAt)}
                    </TD>
                    {canManage && (
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {a.status === "ABIERTA" && (
                            <form action={updateAlertStatus}>
                              <input
                                type="hidden"
                                name="alertId"
                                value={a.id}
                              />
                              <input
                                type="hidden"
                                name="newStatus"
                                value="EN_SEGUIMIENTO"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                type="submit"
                                title="Iniciar seguimiento"
                              >
                                <Eye className="h-3.5 w-3.5 text-amber-500" />
                              </Button>
                            </form>
                          )}
                          {(a.status === "ABIERTA" ||
                            a.status === "EN_SEGUIMIENTO") && (
                            <form action={updateAlertStatus}>
                              <input
                                type="hidden"
                                name="alertId"
                                value={a.id}
                              />
                              <input
                                type="hidden"
                                name="newStatus"
                                value="CERRADA"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                type="submit"
                                title="Cerrar alerta"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                            </form>
                          )}
                          {a.status === "CERRADA" && (
                            <form action={updateAlertStatus}>
                              <input
                                type="hidden"
                                name="alertId"
                                value={a.id}
                              />
                              <input
                                type="hidden"
                                name="newStatus"
                                value="ABIERTA"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                type="submit"
                                title="Reabrir alerta"
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-brand-blue" />
                              </Button>
                            </form>
                          )}
                        </div>
                      </TD>
                    )}
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {!canManage && (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <span className="mt-0.5 text-sm">🔒</span>
          <p className="text-sm text-zinc-600">Tu rol permite ver alertas, pero no generar ni cambiar su estado.</p>
        </div>
      )}

      <p className="text-center text-sm text-zinc-500">
        Mostrando {alerts.length} alerta{alerts.length !== 1 ? "s" : ""}
        {filterStatus === "CERRADA"
          ? " cerradas"
          : " activas (abiertas + en seguimiento)"}
      </p>
    </div>
  );
}
