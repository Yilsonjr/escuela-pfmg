import { revalidatePath } from "next/cache";

import { addDays } from "date-fns";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { weekStartMonday } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

async function generateWeeklyRiskAndAlerts() {
  "use server";
  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
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
      enrollmentId: { in: enrollments.map((e) => e.id) },
      status: "AUSENTE",
      date: { gte: weekStart, lt: weekEnd },
    },
    _count: { _all: true },
  });
  const absByEnrollment = new Map(absences.map((a) => [a.enrollmentId, a._count._all]));

  const psicologia = await prisma.staff.findFirst({
    where: { type: "PSICOLOGIA", isActive: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  for (const e of enrollments) {
    const count = absByEnrollment.get(e.id) ?? 0;
    const severity = count >= 3 ? "ROJO" : count === 2 ? "AMARILLO" : count === 0 ? "VERDE" : "VERDE";

    await prisma.studentRiskSnapshot.upsert({
      where: { enrollmentId_weekStart: { enrollmentId: e.id, weekStart } },
      update: { absences: count, severity, schoolYearId: activeYear.id },
      create: {
        enrollmentId: e.id,
        schoolYearId: activeYear.id,
        weekStart,
        absences: count,
        severity,
      },
    });

    if (severity !== "ROJO") continue;

    const existing = await prisma.alert.findFirst({
      where: {
        enrollmentId: e.id,
        severity: "ROJO",
        createdAt: { gte: weekStart, lt: weekEnd },
        status: { in: ["ABIERTA", "EN_SEGUIMIENTO"] },
      },
    });
    if (existing) continue;

    await prisma.alert.create({
      data: {
        severity: "ROJO",
        title: "Riesgo de abandono (inasistencias semana)",
        details: `Se detectaron ${count} inasistencias en la semana.`,
        studentId: e.studentId,
        enrollmentId: e.id,
        assignedStaffId: psicologia?.id ?? null,
      },
    });
  }

  revalidatePath("/admin/alertas");
}

export default async function AlertasPage() {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "alerts:manage");

  const alerts = await prisma.alert.findMany({
    include: {
      student: true,
      enrollment: { include: { section: { include: { grade: true } } } },
      assignedStaff: true,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        description="Alertas automáticas y seguimiento por Psicología."
        actions={
          canManage ? (
            <form action={generateWeeklyRiskAndAlerts}>
              <Button type="submit">Generar alertas (semana)</Button>
            </form>
          ) : undefined
        }
      />

      <Table>
        <THead>
          <TR>
            <TH>Severidad</TH>
            <TH>Estudiante</TH>
            <TH>Sección</TH>
            <TH>Título</TH>
            <TH>Asignado</TH>
            <TH>Estado</TH>
            <TH>Creado</TH>
          </TR>
        </THead>
        <TBody>
          {alerts.map((a) => (
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
                {a.student ? `${a.student.lastName}, ${a.student.firstName}` : "—"}
              </TD>
              <TD className="text-muted-foreground">
                {a.enrollment
                  ? `${a.enrollment.section.grade.name} ${a.enrollment.section.letter}`
                  : "—"}
              </TD>
              <TD>{a.title}</TD>
              <TD className="text-muted-foreground">
                {a.assignedStaff ? `${a.assignedStaff.lastName}, ${a.assignedStaff.firstName}` : "—"}
              </TD>
              <TD className="text-muted-foreground">{a.status}</TD>
              <TD className="text-muted-foreground">
                {new Intl.DateTimeFormat("es-DO").format(a.createdAt)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      {!canManage ? (
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          Tu rol no permite generar/cerrar alertas.
        </div>
      ) : null}
    </div>
  );
}

