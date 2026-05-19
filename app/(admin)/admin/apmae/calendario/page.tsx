import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/authz";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const meetingSchema = z.object({
  title: z.string().min(3),
  startsAt: z.string().min(10),
  endsAt: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  minutesUrl: z.string().url().optional().or(z.literal("")),
});

async function createMeeting(formData: FormData) {
  "use server";
  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location"),
    minutesUrl: formData.get("minutesUrl"),
  });
  if (!parsed.success) return;

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  if (!activeYear) return;

  await prisma.meeting.create({
    data: {
      schoolYearId: activeYear.id,
      title: parsed.data.title,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      location: parsed.data.location || null,
      minutesUrl: parsed.data.minutesUrl || null,
    },
  });

  revalidatePath("/admin/apmae/calendario");
}

export default async function ApmaeCalendarioPage() {
  const session = await requireAuth();
  const canManage = hasPermission(session.user?.permissions, "meetings:manage");

  const activeYear = await prisma.schoolYear.findFirst({ where: { isActive: true } });
  const meetings = activeYear
    ? await prisma.meeting.findMany({
        where: { schoolYearId: activeYear.id },
        orderBy: { startsAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="APMAE"
        description="Calendario de reuniones y actas."
        actions={
          <a
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/[.02]"
            href="/api/reports/meetings"
          >
            Descargar PDF
          </a>
        }
      />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Programar reunión</CardTitle>
            <CardDescription>Registra fecha/hora y, si existe, enlace al acta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createMeeting} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Título</label>
                <Input name="title" placeholder="Reunión APMAE - Mayo" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Inicio</label>
                <Input name="startsAt" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fin</label>
                <Input name="endsAt" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lugar</label>
                <Input name="location" placeholder="(opcional)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL acta</label>
                <Input name="minutesUrl" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
          Tu rol permite ver reuniones, pero no gestionarlas.
        </div>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Reunión</TH>
            <TH>Fecha</TH>
            <TH>Lugar</TH>
            <TH>Acta</TH>
          </TR>
        </THead>
        <TBody>
          {meetings.map((m) => (
            <TR key={m.id}>
              <TD className="font-medium">{m.title}</TD>
              <TD className="text-muted-foreground">
                {new Intl.DateTimeFormat("es-DO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(m.startsAt)}
              </TD>
              <TD className="text-muted-foreground">{m.location ?? "—"}</TD>
              <TD>
                {m.minutesUrl ? (
                  <a className="text-brand-blue hover:underline" href={m.minutesUrl} target="_blank" rel="noreferrer">
                    Ver
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

