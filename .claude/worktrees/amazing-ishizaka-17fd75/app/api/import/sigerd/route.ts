import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GradeCode, SectionLetter } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseSigerdExcel } from "@/lib/sigerd-parser";

/**
 * POST /api/import/sigerd
 * Accepts a SIGERD Excel file (multipart/form-data, field name "file")
 * and upserts students + enrollments for the active school year.
 */
export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const permissions = (token.permissions as string[] | undefined) ?? [];
  const canImport =
    permissions.includes("center:manage") ||
    permissions.includes("students:manage");
  if (!canImport) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  // ── Active school year ────────────────────────────────
  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });
  if (!activeYear) {
    return NextResponse.json(
      { error: "No hay un año escolar activo." },
      { status: 400 },
    );
  }

  // ── Read file ─────────────────────────────────────────
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No se recibió archivo." },
      { status: 400 },
    );
  }

  const buffer = await file.arrayBuffer();

  // ── Parse Excel ───────────────────────────────────────
  const { students, errors: parseErrors } = parseSigerdExcel(buffer);

  if (students.length === 0) {
    return NextResponse.json(
      {
        error: "No se encontraron estudiantes en el archivo.",
        parseErrors,
      },
      { status: 400 },
    );
  }

  // ── Pre-load sections (grade+letter → sectionId) ─────
  const sections = await prisma.section.findMany({
    include: { grade: true },
  });

  const sectionMap = new Map<string, string>();
  for (const s of sections) {
    // key: "PRIMERO-A"
    sectionMap.set(`${s.grade.code}-${s.letter}`, s.id);
  }

  const validGrades = new Set(Object.values(GradeCode));
  const validLetters = new Set(Object.values(SectionLetter));

  // ── Upsert students ───────────────────────────────────
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const importErrors: string[] = [...parseErrors];

  for (const s of students) {
    // Validate grade
    if (!validGrades.has(s.grade as GradeCode)) {
      importErrors.push(
        `Estudiante ${s.sigerdId} (${s.firstName} ${s.lastName}): grado "${s.grade}" no reconocido.`,
      );
      skipped++;
      continue;
    }

    // Normalize section letter (take first char, uppercase)
    const sectionLetter = s.section
      ? s.section.charAt(0).toUpperCase()
      : "A";

    if (!validLetters.has(sectionLetter as SectionLetter)) {
      importErrors.push(
        `Estudiante ${s.sigerdId}: sección "${s.section}" no válida.`,
      );
      skipped++;
      continue;
    }

    const sectionKey = `${s.grade}-${sectionLetter}`;
    const sectionId = sectionMap.get(sectionKey);
    if (!sectionId) {
      importErrors.push(
        `Estudiante ${s.sigerdId}: sección ${sectionKey} no existe en la base de datos.`,
      );
      skipped++;
      continue;
    }

    try {
      // Upsert student by sigerdId
      const student = await prisma.student.upsert({
        where: { sigerdId: s.sigerdId },
        update: {
          firstName: s.firstName,
          lastName: s.lastName,
          birthDate: s.birthDate ? new Date(s.birthDate) : undefined,
        },
        create: {
          sigerdId: s.sigerdId,
          firstName: s.firstName,
          lastName: s.lastName,
          birthDate: s.birthDate ? new Date(s.birthDate) : null,
        },
      });

      // Check if enrollment already exists
      const existing = await prisma.enrollment.findUnique({
        where: {
          studentId_sectionId_schoolYearId: {
            studentId: student.id,
            sectionId,
            schoolYearId: activeYear.id,
          },
        },
      });

      if (existing) {
        // Update status if student was previously withdrawn
        const newStatus =
          s.status === "Inscrito" || s.status === "Registrado"
            ? "ACTIVO"
            : s.status === "Retirado"
              ? "RETIRADO"
              : "ACTIVO";

        await prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: newStatus as "ACTIVO" | "RETIRADO" | "EGRESADO" },
        });
        updated++;
      } else {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            sectionId,
            schoolYearId: activeYear.id,
            status: "ACTIVO",
          },
        });
        created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      importErrors.push(`Error con estudiante ${s.sigerdId}: ${msg}`);
      skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      total: students.length,
      created,
      updated,
      skipped,
    },
    errors: importErrors.length > 0 ? importErrors : undefined,
  });
}
