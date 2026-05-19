import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GradeCode, SectionLetter } from "@prisma/client";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

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

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
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

async function importStudentsCsv(formData: FormData) {
  "use server";
  const file = formData.get("csv") as File | null;
  if (!file) return;

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return;

  const text = await file.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return;

  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const required = ["firstName", "lastName", "gradeCode", "sectionLetter"];
  if (required.some((r) => idx(r) === -1)) return;

  const gradeCodes = new Set(["PREPRIMARIO", "KINDER", "PRIMERO", "SEGUNDO", "TERCERO"]);
  const letters = new Set(["A", "B", "C", "D"]);

  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim());
    const firstName = cols[idx("firstName")] ?? "";
    const lastName = cols[idx("lastName")] ?? "";
    const gradeCode = (cols[idx("gradeCode")] ?? "").toUpperCase();
    const sectionLetter = (cols[idx("sectionLetter")] ?? "").toUpperCase();
    const guardianName = idx("guardianName") !== -1 ? cols[idx("guardianName")] : "";
    const guardianPhone = idx("guardianPhone") !== -1 ? cols[idx("guardianPhone")] : "";

    if (firstName.length < 2 || lastName.length < 2) continue;
    if (!gradeCodes.has(gradeCode) || !letters.has(sectionLetter)) continue;

    const section = await prisma.section.findFirst({
      where: {
        letter: sectionLetter as SectionLetter,
        grade: { code: gradeCode as GradeCode },
      },
      include: { grade: true },
    });
    if (!section) continue;

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sectionId: section.id,
        schoolYearId: activeYear.id,
      },
    });
  }

  revalidatePath("/admin/alumnado");
}

export default async function AlumnadoPage() {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "students:manage");

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  const sections = await prisma.section.findMany({
    include: { grade: true },
    orderBy: [{ grade: { order: "asc" } }, { letter: "asc" }],
  });

  const enrollments = activeYear
    ? await prisma.enrollment.findMany({
        where: { schoolYearId: activeYear.id },
        include: {
          student: true,
          section: { include: { grade: true } },
        },
        orderBy: [{ section: { grade: { order: "asc" } } }, { section: { letter: "asc" } }],
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumnado"
        description={`Matrícula por grados y secciones${activeYear ? ` (${activeYear.label})` : ""}.`}
        actions={
          canManage ? (
            <a
              className="rounded-full bg-brand-gold px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              href="/api/reports/enrollment"
            >
              Descargar PDF
            </a>
          ) : undefined
        }
      />

      {!activeYear ? (
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          No hay un año escolar activo. Ejecuta el seed/migración para crear uno.
        </div>
      ) : null}

      {canManage && activeYear ? (
        <Card>
          <CardHeader>
            <CardTitle>Registrar estudiante</CardTitle>
            <CardDescription>Creará el estudiante y su matrícula en la sección seleccionada.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createStudentWithEnrollment} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombres</label>
                <Input name="firstName" placeholder="Juan" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Apellidos</label>
                <Input name="lastName" placeholder="Pérez" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tutor/Encargado</label>
                <Input name="guardianName" placeholder="(opcional)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono tutor</label>
                <Input name="guardianPhone" placeholder="(opcional)" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Sección</label>
                <select
                  name="sectionId"
                  className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-brand-blue/60 focus:ring-4 focus:ring-brand-blue/10"
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
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          Tu rol permite ver el alumnado, pero no registrar/editar.
        </div>
      )}

      {canManage && activeYear ? (
        <Card>
          <CardHeader>
            <CardTitle>Importar CSV (opcional)</CardTitle>
            <CardDescription>
              Formato: encabezado con `firstName,lastName,gradeCode,sectionLetter` y opcionales
              `guardianName,guardianPhone`. Ej: PRIMERO,A.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={importStudentsCsv} className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Archivo CSV</label>
                <input
                  name="csv"
                  type="file"
                  accept=".csv,text/csv"
                  className="block w-full text-sm"
                  required
                />
              </div>
              <Button type="submit">Importar</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Table>
        <THead>
          <TR>
            <TH>Estudiante</TH>
            <TH>Sección</TH>
            <TH>Tutor</TH>
            <TH>Teléfono</TH>
          </TR>
        </THead>
        <TBody>
          {enrollments.map((e) => (
            <TR key={e.id}>
              <TD className="font-medium">
                {e.student.lastName}, {e.student.firstName}
              </TD>
              <TD>
                {e.section.grade.name} {e.section.letter}
              </TD>
              <TD className="text-muted-foreground">{e.student.guardianName ?? "—"}</TD>
              <TD className="text-muted-foreground">{e.student.guardianPhone ?? "—"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

