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
    permissions.includes("center:manage") ||
    permissions.includes("meetings:manage") ||
    permissions.includes("meetings:read");
  if (!isAllowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return NextResponse.json({ error: "No active school year" }, { status: 400 });

  const meetings = await prisma.meeting.findMany({
    where: { schoolYearId: activeYear.id },
    orderBy: { startsAt: "desc" },
  });

  const fmt = new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short" });
  const lines = meetings.map((m) => {
    const when = fmt.format(m.startsAt);
    const where = m.location ? ` | ${m.location}` : "";
    const minutes = m.minutesUrl ? " | Acta: Sí" : " | Acta: No";
    return `${when} — ${m.title}${where}${minutes}`;
  });

  const bytes = await simpleReportPdf({
    title: "Reporte de reuniones APMAE",
    subtitle: `Año escolar: ${activeYear.label} | Total: ${meetings.length}`,
    lines,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="apmae-${activeYear.label}.pdf"`,
    },
  });
}

