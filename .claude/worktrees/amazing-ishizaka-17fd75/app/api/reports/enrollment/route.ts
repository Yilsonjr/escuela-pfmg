import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { simpleReportPdf } from "@/lib/pdf";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const permissions = (token.permissions as string[] | undefined) ?? [];
  const isAllowed =
    permissions.includes("center:manage") || permissions.includes("students:manage");
  if (!isAllowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return NextResponse.json({ error: "No active school year" }, { status: 400 });

  const enrollments = await prisma.enrollment.findMany({
    where: { schoolYearId: activeYear.id },
    include: { student: true, section: { include: { grade: true } } },
    orderBy: [
      { section: { grade: { order: "asc" } } },
      { section: { letter: "asc" } },
      { student: { lastName: "asc" } },
      { student: { firstName: "asc" } },
    ],
  });

  const lines = enrollments.map(
    (e) =>
      `${e.section.grade.name} ${e.section.letter} — ${e.student.lastName}, ${e.student.firstName}`,
  );

  const bytes = await simpleReportPdf({
    title: "Reporte de matrícula",
    subtitle: `Año escolar: ${activeYear.label} | Total: ${enrollments.length}`,
    lines,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="matricula-${activeYear.label}.pdf"`,
    },
  });
}

