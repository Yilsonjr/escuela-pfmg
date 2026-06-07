import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Search, Users, FileSpreadsheet, GraduationCap } from "lucide-react";

import { SigerdImportForm } from "./sigerd-import-form";
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

/* ── Server Actions ────────────────────────────────────────── */

const studentSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  guardianName: z.string().optional().or(z.literal("")),
  guardianPhone: z.string().optional().or(z.literal("")),
  sectionId: z.string().min(1),
});

async function createStudentWithEnrollment(formData: FormData) {
  "use server";
  const parsed = studentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
    sectionId: formData.get("sectionId"),
  });
  if (!parsed.success) return;

  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });
  if (!activeYear) return;

  const student = await prisma.student.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      guardianName: parsed.data.guardianName || null,
      guardianPhone: parsed.data.guardianPhone || null,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student.id,
      sectionId: parsed.data.sectionId,
      schoolYearId: activeYear.id,
    },
  });

  revalidatePath("/admin/alumnado");
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function AlumnadoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    grade?: string;
    section?: string;
    status?: string;
  }>;
}) {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "students:manage");
  const params = await searchParams;
  const query = params.q || "";
  const filterGrade = params.grade || "";
  const filterSection = params.section || "";
  const filterStatus = params.status || "";

  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });

  const sections = await prisma.section.findMany({
    include: { grade: true },
    orderBy: [{ grade: { order: "asc" } }, { letter: "asc" }],
  });

  // Build enrollment query filters
  const enrollmentWhere: Record<string, unknown> = {};
  if (activeYear) enrollmentWhere.schoolYearId = activeYear.id;
  if (filterStatus === "ACTIVO" || filterStatus === "RETIRADO") {
    enrollmentWhere.status = filterStatus;
  }

  // Section/grade filter
  const sectionWhere: Record<string, unknown> = {};
  if (filterGrade) {
    sectionWhere.grade = { code: filterGrade };
  }
  if (filterSection) {
    sectionWhere.letter = filterSection;
  }
  if (Object.keys(sectionWhere).length > 0) {
    enrollmentWhere.section = sectionWhere;
  }

  // Student name search
  if (query) {
    enrollmentWhere.student = {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { sigerdId: { contains: query, mode: "insensitive" } },
      ],
    };
  }

  const enrollments = activeYear
    ? await prisma.enrollment.findMany({
        where: enrollmentWhere,
        include: {
          student: true,
          section: { include: { grade: true } },
        },
        orderBy: [
          { section: { grade: { order: "asc" } } },
          { section: { letter: "asc" } },
          { student: { lastName: "asc" } },
          { student: { firstName: "asc" } },
        ],
        take: 200,
      })
    : [];

  // Stats
  const totalEnrolled = activeYear
    ? await prisma.enrollment.count({
        where: { schoolYearId: activeYear.id, status: "ACTIVO" },
      })
    : 0;

  const totalStudents = await prisma.student.count();

  // Grade counts for stat cards
  const grades = await prisma.grade.findMany({ orderBy: { order: "asc" } });
  const gradeCounts: { name: string; code: string; count: number }[] = [];

  if (activeYear) {
    for (const g of grades) {
      const count = await prisma.enrollment.count({
        where: {
          schoolYearId: activeYear.id,
          status: "ACTIVO",
          section: { gradeId: g.id },
        },
      });
      gradeCounts.push({ name: g.name, code: g.code, count });
    }
  }

  // Unique grades for filter buttons
  const gradeOptions = grades.map((g) => ({
    code: g.code,
    name: g.name,
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Alumnado"
        description={
          activeYear
            ? `${totalEnrolled} estudiantes activos · Año ${activeYear.label}`
            : "Sin año escolar activo"
        }
        icon={GraduationCap}
        iconBg="bg-brand-blue"
        iconColor="text-white"
        actions={
          canManage ? (
            <a
              className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              href="/api/reports/enrollment"
            >
              Descargar PDF
            </a>
          ) : undefined
        }
      />

      {!activeYear && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          No hay un año escolar activo. Ejecuta el seed/migración para crear
          uno.
        </div>
      )}

      {/* ── Estadísticas por grado ──────────────────────── */}
      {activeYear && gradeCounts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {gradeCounts.map((g) => (
            <a
              key={g.code}
              href={`/admin/alumnado?grade=${g.code}`}
              className={`rounded-xl border p-3 text-center transition-colors hover:border-brand-blue/30 hover:bg-brand-blue/5 ${
                filterGrade === g.code
                  ? "border-brand-blue/40 bg-brand-blue/10"
                  : "border-black/5 bg-white"
              }`}
            >
              <p className="text-xl font-semibold text-brand-blue">{g.count}</p>
              <p className="text-sm font-medium text-zinc-600">{g.name}</p>
            </a>
          ))}
        </div>
      )}

      {/* ── Importar SIGERD ─────────────────────────────── */}
      {canManage && activeYear && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
                <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <CardTitle>Importar desde SIGERD</CardTitle>
                <CardDescription>
                  Sube el archivo Excel &quot;Relación de Estudiantes por
                  Secciones&quot; exportado desde SIGERD. Se crearán o
                  actualizarán los estudiantes automáticamente.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SigerdImportForm />
          </CardContent>
        </Card>
      )}

      {/* ── Registro manual (colapsable) ────────────────── */}
      {canManage && activeYear && (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black">
            <span className="transition-transform group-open:rotate-90">
              &#9654;
            </span>
            Registrar estudiante manualmente
          </summary>
          <Card className="mt-3">
            <CardContent className="pt-6">
              <form
                action={createStudentWithEnrollment}
                className="grid gap-4 md:grid-cols-2"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nombres</label>
                  <Input name="firstName" placeholder="Juan" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Apellidos</label>
                  <Input name="lastName" placeholder="Pérez" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">
                    Tutor/Encargado
                  </label>
                  <Input name="guardianName" placeholder="(opcional)" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Teléfono tutor</label>
                  <Input name="guardianPhone" placeholder="(opcional)" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-zinc-700">Sección</label>
                  <select
                    name="sectionId"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
                    required
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.grade.name} {s.letter}
                      </option>
                    ))}
                  </select>
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
          <p className="text-sm text-zinc-600">Tu rol permite ver el alumnado, pero no registrar/editar.</p>
        </div>
      )}

      {/* ── Búsqueda y filtros ──────────────────────────── */}
      {activeYear && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            action="/admin/alumnado"
            method="GET"
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="q"
              type="search"
              placeholder="Buscar por nombre, apellido o ID SIGERD..."
              defaultValue={query}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
            />
            {filterGrade && (
              <input type="hidden" name="grade" value={filterGrade} />
            )}
            {filterStatus && (
              <input type="hidden" name="status" value={filterStatus} />
            )}
          </form>

          {/* Grade filter pills */}
          <div className="flex flex-wrap gap-2">
            <a href="/admin/alumnado">
              <Button
                variant={!filterGrade ? "primary" : "secondary"}
                size="sm"
              >
                Todos
              </Button>
            </a>
            {gradeOptions.map((g) => (
              <a
                key={g.code}
                href={`/admin/alumnado?grade=${g.code}${query ? `&q=${query}` : ""}`}
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
        </div>
      )}

      {/* Status filter */}
      {activeYear && (
        <div className="flex gap-2">
          {[
            { key: "", label: "Todos los estados" },
            { key: "ACTIVO", label: "Activos" },
            { key: "RETIRADO", label: "Retirados" },
          ].map((opt) => (
            <a
              key={opt.key}
              href={`/admin/alumnado?${opt.key ? `status=${opt.key}` : ""}${filterGrade ? `&grade=${filterGrade}` : ""}${query ? `&q=${query}` : ""}`}
            >
              <Badge
                variant={
                  filterStatus === opt.key ||
                  (!filterStatus && opt.key === "")
                    ? "blue"
                    : "neutral"
                }
              >
                {opt.label}
              </Badge>
            </a>
          ))}
        </div>
      )}

      {/* ── Tabla de estudiantes ─────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>ID SIGERD</TH>
                <TH>Estudiante</TH>
                <TH>Grado / Sección</TH>
                <TH>Fecha Nac.</TH>
                <TH>Estado</TH>
                <TH>Tutor</TH>
              </TR>
            </THead>
            <TBody>
              {enrollments.length === 0 ? (
                <TR>
                  <TD
                    colSpan={6}
                    className="py-12 text-center text-zinc-600"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-zinc-300" />
                      {query || filterGrade || filterStatus ? (
                        <p>No se encontraron estudiantes con esos filtros.</p>
                      ) : (
                        <p>
                          No hay estudiantes registrados. Importa desde SIGERD o
                          registra manualmente.
                        </p>
                      )}
                    </div>
                  </TD>
                </TR>
              ) : (
                enrollments.map((e) => (
                  <TR key={e.id}>
                    <TD className="font-mono text-sm text-zinc-500">
                      {e.student.sigerdId ?? "—"}
                    </TD>
                    <TD className="font-medium">
                      {e.student.lastName}, {e.student.firstName}
                    </TD>
                    <TD>
                      <Badge variant="blue">
                        {e.section.grade.name} {e.section.letter}
                      </Badge>
                    </TD>
                    <TD className="text-zinc-600">
                      {e.student.birthDate
                        ? new Date(e.student.birthDate).toLocaleDateString(
                            "es-DO",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </TD>
                    <TD>
                      <Badge
                        variant={
                          e.status === "ACTIVO"
                            ? "green"
                            : e.status === "RETIRADO"
                              ? "red"
                              : "yellow"
                        }
                      >
                        {e.status === "ACTIVO"
                          ? "Activo"
                          : e.status === "RETIRADO"
                            ? "Retirado"
                            : "Egresado"}
                      </Badge>
                    </TD>
                    <TD className="text-zinc-600">
                      {e.student.guardianName ?? "—"}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-zinc-500">
        Mostrando {enrollments.length} de {totalEnrolled} estudiantes activos ·{" "}
        {totalStudents} registrados en total
      </p>
    </div>
  );
}

