import { revalidatePath } from "next/cache";
import { formatISO, parseISO } from "date-fns";
import { AttendanceStatus } from "@prisma/client";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { weekStartMonday } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

async function saveAttendance(formData: FormData) {
  "use server";
  const sectionId = String(formData.get("sectionId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  if (!sectionId || !dateStr) return;

  const date = parseISO(dateStr);
  const enrollmentIds = formData.getAll("enrollmentId").map(String);

  for (const enrollmentId of enrollmentIds) {
    const raw = String(formData.get(`status:${enrollmentId}`) ?? "PRESENTE");
    const status: AttendanceStatus =
      raw === "AUSENTE" ? "AUSENTE" : raw === "TARDE" ? "TARDE" : "PRESENTE";
    await prisma.attendanceRecord.upsert({
      where: { enrollmentId_date: { enrollmentId, date } },
      update: { status },
      create: { enrollmentId, date, status },
    });
  }

  revalidatePath(`/admin/asistencia?sectionId=${encodeURIComponent(sectionId)}&date=${encodeURIComponent(dateStr)}`);
}

function riskBadge(absencesThisWeek: number) {
  if (absencesThisWeek >= 3) return <Badge variant="red">Rojo</Badge>;
  if (absencesThisWeek === 2) return <Badge variant="yellow">Amarillo</Badge>;
  if (absencesThisWeek === 0) return <Badge variant="green">Verde</Badge>;
  return <Badge variant="neutral">—</Badge>;
}

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "attendance:manage");

  const { sectionId, date } = await searchParams;
  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });

  const sections = await prisma.section.findMany({
    include: { grade: true },
    orderBy: [{ grade: { order: "asc" } }, { letter: "asc" }],
  });

  const selectedSectionId = sectionId ?? sections[0]?.id;
  const selectedDate = date ? parseISO(date) : new Date();
  const selectedDateStr = formatISO(selectedDate, { representation: "date" });

  if (!activeYear || !selectedSectionId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Asistencia" description="Registro diario por sección." />
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          Falta configuración base (año escolar activo o secciones).
        </div>
      </div>
    );
  }

  const weekStart = weekStartMonday(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const enrollments = await prisma.enrollment.findMany({
    where: { schoolYearId: activeYear.id, sectionId: selectedSectionId },
    include: { student: true },
    orderBy: [{ student: { lastName: "asc" } }, { student: { firstName: "asc" } }],
  });

  const attendanceForDay = await prisma.attendanceRecord.findMany({
    where: {
      enrollmentId: { in: enrollments.map((e) => e.id) },
      date: selectedDate,
    },
  });

  const attendanceByEnrollment = new Map(attendanceForDay.map((r) => [r.enrollmentId, r.status]));

  const weeklyAbsences = await prisma.attendanceRecord.groupBy({
    by: ["enrollmentId"],
    where: {
      enrollmentId: { in: enrollments.map((e) => e.id) },
      date: { gte: weekStart, lt: weekEnd },
      status: "AUSENTE",
    },
    _count: { _all: true },
  });

  const absencesByEnrollment = new Map(weeklyAbsences.map((r) => [r.enrollmentId, r._count._all]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistencia"
        description="Registro diario por sección y vista semáforo semanal."
      />

      <form
        action={saveAttendance}
        className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sección</label>
            <select
              name="sectionId"
              defaultValue={selectedSectionId}
              className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.grade.name} {s.letter}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <input
              name="date"
              type="date"
              defaultValue={selectedDateStr}
              className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={!canManage}>
              Guardar asistencia
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Table>
            <THead>
              <TR>
                <TH>Estudiante</TH>
                <TH>Estado del día</TH>
                <TH>Semáforo (semana)</TH>
                <TH>Inasistencias (semana)</TH>
              </TR>
            </THead>
            <TBody>
              {enrollments.map((e) => {
                const current = attendanceByEnrollment.get(e.id) ?? "PRESENTE";
                const abs = absencesByEnrollment.get(e.id) ?? 0;
                return (
                  <TR key={e.id}>
                    <TD className="font-medium">
                      {e.student.lastName}, {e.student.firstName}
                      <input type="hidden" name="enrollmentId" value={e.id} />
                    </TD>
                    <TD>
                      <select
                        name={`status:${e.id}`}
                        defaultValue={current}
                        className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none"
                        disabled={!canManage}
                      >
                        <option value="PRESENTE">Presente</option>
                        <option value="AUSENTE">Ausente</option>
                        <option value="TARDE">Tarde</option>
                      </select>
                    </TD>
                    <TD>{riskBadge(abs)}</TD>
                    <TD className="text-muted-foreground">{abs}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>

        {!canManage ? (
          <div className="mt-4 text-sm text-muted-foreground">
            Tu rol no permite modificar asistencia.
          </div>
        ) : null}
      </form>
    </div>
  );
}

