import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatISO, parseISO, format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { AttendanceStatus } from "@prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
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

  revalidatePath("/admin/asistencia");
  redirect(
    `/admin/asistencia?sectionId=${encodeURIComponent(sectionId)}&date=${encodeURIComponent(dateStr)}`,
  );
}

/* ── Helpers ────────────────────────────────────────────────── */

function riskBadge(absencesThisWeek: number) {
  if (absencesThisWeek >= 3) return <Badge variant="red">Riesgo alto</Badge>;
  if (absencesThisWeek === 2)
    return <Badge variant="yellow">Atención</Badge>;
  return null;
}

const STATUS_STYLES: Record<
  AttendanceStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  PRESENTE: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    label: "Presente",
  },
  AUSENTE: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    label: "Ausente",
  },
  TARDE: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    label: "Tarde",
  },
};

/* ── Page ──────────────────────────────────────────────────── */

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; date?: string }>;
}) {
  const session = await requireAuth();
  const canManage = hasPermission(
    session.user?.permissions,
    "attendance:manage",
  );

  const params = await searchParams;
  const [activeYear, sections] = await Promise.all([
    prisma.schoolYear.findFirst({ where: { isActive: true } }),
    prisma.section.findMany({
      include: { grade: true },
      orderBy: [{ grade: { order: "asc" } }, { letter: "asc" }],
    }),
  ]);

  const selectedSectionId = params.sectionId ?? sections[0]?.id;
  const selectedDate = params.date ? parseISO(params.date) : new Date();
  const selectedDateStr = formatISO(selectedDate, { representation: "date" });

  if (!activeYear || !selectedSectionId) {
    return (
      <div className="space-y-6">
        <ModuleHeader
          title="Asistencia"
          description="Registro diario por sección."
          icon={CalendarCheck}
          iconBg="bg-emerald-600"
          iconColor="text-white"
        />
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Falta configuración base (año escolar activo o secciones).
        </div>
      </div>
    );
  }

  // Current section info
  const currentSection = sections.find((s) => s.id === selectedSectionId);
  const sectionLabel = currentSection
    ? `${currentSection.grade.name} ${currentSection.letter}`
    : "";

  // Date navigation
  const prevDateStr = formatISO(subDays(selectedDate, 1), {
    representation: "date",
  });
  const nextDateStr = formatISO(addDays(selectedDate, 1), {
    representation: "date",
  });
  const isToday =
    formatISO(new Date(), { representation: "date" }) === selectedDateStr;
  const displayDate = format(selectedDate, "EEEE d 'de' MMMM, yyyy", {
    locale: es,
  });

  // Week range for risk calculation
  const weekStart = weekStartMonday(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Enrollments for this section
  const enrollments = await prisma.enrollment.findMany({
    where: {
      schoolYearId: activeYear.id,
      sectionId: selectedSectionId,
      status: "ACTIVO",
    },
    include: { student: true },
    orderBy: [
      { student: { lastName: "asc" } },
      { student: { firstName: "asc" } },
    ],
  });

  const enrollmentIds = enrollments.map((e: { id: string }) => e.id);

  const [attendanceForDay, weeklyAbsences] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { enrollmentId: { in: enrollmentIds }, date: selectedDate },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["enrollmentId"],
      where: { enrollmentId: { in: enrollmentIds }, date: { gte: weekStart, lt: weekEnd }, status: "AUSENTE" },
      _count: { _all: true },
    }),
  ]);

  const attendanceByEnrollment = new Map<string, AttendanceStatus>(
    attendanceForDay.map((r) => [r.enrollmentId, r.status] as [string, AttendanceStatus]),
  );

  const absencesByEnrollment = new Map<string, number>(
    weeklyAbsences.map((r) => [r.enrollmentId, r._count._all] as [string, number]),
  );

  // Day summary stats
  const totalStudents = enrollments.length;
  const presentes = attendanceForDay.filter(
    (r) => r.status === "PRESENTE",
  ).length;
  const ausentes = attendanceForDay.filter(
    (r) => r.status === "AUSENTE",
  ).length;
  const tardes = attendanceForDay.filter((r) => r.status === "TARDE").length;
  const sinRegistrar = totalStudents - attendanceForDay.length;
  const attendanceRate =
    totalStudents > 0 && attendanceForDay.length > 0
      ? Math.round(((presentes + tardes) / totalStudents) * 100)
      : null;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Asistencia"
        description={`Registro diario — ${activeYear.label}`}
        icon={CalendarCheck}
        iconBg="bg-emerald-600"
        iconColor="text-white"
      />

      {/* ── Selector de sección ─────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`/admin/asistencia?sectionId=${s.id}&date=${selectedDateStr}`}
          >
            <Button
              variant={s.id === selectedSectionId ? "primary" : "secondary"}
              size="sm"
            >
              {s.grade.name} {s.letter}
            </Button>
          </a>
        ))}
      </div>

      {/* ── Navegación de fecha ─────────────────────────── */}
      <div className="flex items-center gap-3">
        <a
          href={`/admin/asistencia?sectionId=${selectedSectionId}&date=${prevDateStr}`}
        >
          <Button variant="secondary" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </a>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-600" />
          <span className="text-sm font-semibold text-zinc-800 capitalize">{displayDate}</span>
          {isToday && <Badge variant="blue">Hoy</Badge>}
        </div>

        <a
          href={`/admin/asistencia?sectionId=${selectedSectionId}&date=${nextDateStr}`}
        >
          <Button variant="secondary" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </a>

        {!isToday && (
          <a
            href={`/admin/asistencia?sectionId=${selectedSectionId}&date=${formatISO(new Date(), { representation: "date" })}`}
          >
            <Button variant="secondary" size="sm">
              Ir a hoy
            </Button>
          </a>
        )}
      </div>

      {/* ── Resumen del día ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-black/5 bg-white p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Users className="h-4 w-4 text-brand-blue" />
            <span className="text-xl font-semibold text-brand-blue">
              {totalStudents}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-600">Total</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xl font-semibold text-emerald-700">
              {presentes}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-600">Presentes</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <UserX className="h-4 w-4 text-red-600" />
            <span className="text-xl font-semibold text-red-700">
              {ausentes}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-600">Ausentes</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-xl font-semibold text-amber-700">
              {tardes}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-600">Tardes</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white p-3 text-center">
          <span className="text-xl font-semibold text-brand-blue">
            {attendanceRate !== null ? `${attendanceRate}%` : "—"}
          </span>
          <p className="text-sm font-medium text-zinc-600">Asistencia</p>
        </div>
      </div>

      {/* ── Formulario de asistencia ────────────────────── */}
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-600">
            <Users className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
            <p>No hay estudiantes matriculados en {sectionLabel}.</p>
          </CardContent>
        </Card>
      ) : (
        <form action={saveAttendance}>
          <input type="hidden" name="sectionId" value={selectedSectionId} />
          <input type="hidden" name="date" value={selectedDateStr} />

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                {sectionLabel} — {enrollments.length} estudiantes
              </CardTitle>
              {canManage && (
                <Button type="submit" size="sm">
                  Guardar asistencia
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH className="w-8">#</TH>
                    <TH>Estudiante</TH>
                    <TH>Estado</TH>
                    <TH>Riesgo semanal</TH>
                  </TR>
                </THead>
                <TBody>
                  {enrollments.map((e, idx) => {
                    const current =
                      attendanceByEnrollment.get(e.id) ?? "PRESENTE";
                    const abs = absencesByEnrollment.get(e.id) ?? 0;
                    const style = STATUS_STYLES[current];

                    return (
                      <TR key={e.id}>
                        <TD className="text-sm text-zinc-500">
                          {idx + 1}
                        </TD>
                        <TD className="font-medium">
                          {e.student.lastName}, {e.student.firstName}
                          <input
                            type="hidden"
                            name="enrollmentId"
                            value={e.id}
                          />
                        </TD>
                        <TD>
                          {canManage ? (
                            <select
                              name={`status:${e.id}`}
                              defaultValue={current}
                              className={`h-9 rounded-lg border px-3 text-sm font-medium outline-none ${style.bg} ${style.border} ${style.text}`}
                            >
                              <option value="PRESENTE">✓ Presente</option>
                              <option value="AUSENTE">✗ Ausente</option>
                              <option value="TARDE">◔ Tarde</option>
                            </select>
                          ) : (
                            <Badge
                              variant={
                                current === "PRESENTE"
                                  ? "green"
                                  : current === "AUSENTE"
                                    ? "red"
                                    : "yellow"
                              }
                            >
                              {style.label}
                            </Badge>
                          )}
                        </TD>
                        <TD>
                          {riskBadge(abs)}
                          {abs > 0 && (
                            <span className="ml-2 text-sm text-zinc-500">
                              {abs} falta{abs !== 1 ? "s" : ""}
                            </span>
                          )}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          {canManage && enrollments.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button type="submit">Guardar asistencia</Button>
            </div>
          )}

          {!canManage && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
              <span className="mt-0.5 text-sm">🔒</span>
              <p className="text-sm text-zinc-600">Tu rol permite ver la asistencia, pero no modificarla.</p>
            </div>
          )}
        </form>
      )}

      {sinRegistrar > 0 && attendanceForDay.length > 0 && (
        <p className="text-center text-sm text-zinc-500">
          {sinRegistrar} estudiante{sinRegistrar !== 1 ? "s" : ""} sin registrar
          este día
        </p>
      )}

      {attendanceForDay.length === 0 && enrollments.length > 0 && (
        <p className="text-center text-sm font-medium text-amber-700">
          No se ha registrado asistencia para este día. Todos aparecen como
          &quot;Presente&quot; por defecto.
        </p>
      )}
    </div>
  );
}
