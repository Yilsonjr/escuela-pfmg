import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Trash2,
  Clock,
  FileText,
  UsersRound,
} from "lucide-react";

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

/* ── Server Actions ─────────────────────────────────────────── */

const meetingSchema = z.object({
  title: z.string().min(3),
  startsAt: z.string().min(10),
  endsAt: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  agenda: z.string().optional().or(z.literal("")),
  minutesUrl: z.string().url().optional().or(z.literal("")),
});

async function createMeeting(formData: FormData) {
  "use server";
  const parsed = meetingSchema.safeParse({
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location"),
    agenda: formData.get("agenda"),
    minutesUrl: formData.get("minutesUrl"),
  });
  if (!parsed.success) return;

  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });
  if (!activeYear) return;

  await prisma.meeting.create({
    data: {
      schoolYearId: activeYear.id,
      title: parsed.data.title,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      location: parsed.data.location || null,
      agenda: parsed.data.agenda || null,
      minutesUrl: parsed.data.minutesUrl || null,
    },
  });

  revalidatePath("/admin/apmae/calendario");
}

async function deleteMeeting(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.meeting.delete({ where: { id } });
  revalidatePath("/admin/apmae/calendario");
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function ApmaeCalendarioPage() {
  const session = await requireAuth();
  const canManage = hasPermission(
    session.user?.permissions,
    "meetings:manage",
  );

  const activeYear = await prisma.schoolYear.findFirst({
    where: { isActive: true },
  });

  const meetings = activeYear
    ? await prisma.meeting.findMany({
        where: { schoolYearId: activeYear.id },
        orderBy: { startsAt: "asc" },
      })
    : [];

  const now = new Date();
  const upcoming = meetings.filter((m) => m.startsAt >= now);
  const past = meetings.filter((m) => m.startsAt < now);

  const totalMeetings = meetings.length;
  const withMinutes = meetings.filter((m) => m.minutesUrl).length;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="APMAE"
        description={
          activeYear
            ? `Calendario de reuniones — ${activeYear.label}`
            : "Sin año escolar activo"
        }
        icon={UsersRound}
        iconBg="bg-teal-600"
        iconColor="text-white"
        actions={
          <a
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            href="/api/reports/meetings"
          >
            <FileText className="h-4 w-4" />
            Descargar PDF
          </a>
        }
      />

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-black/5 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-brand-blue">
            {totalMeetings}
          </p>
          <p className="text-sm font-medium text-zinc-600">Total reuniones</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-700">
            {upcoming.length}
          </p>
          <p className="text-sm font-medium text-zinc-600">Próximas</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-zinc-600">{past.length}</p>
          <p className="text-sm font-medium text-zinc-600">Realizadas</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white p-4 text-center">
          <p className="text-2xl font-semibold text-brand-blue">
            {withMinutes}
          </p>
          <p className="text-sm font-medium text-zinc-600">Con acta</p>
        </div>
      </div>

      {/* ── Programar reunión ───────────────────────────── */}
      {canManage && activeYear && (
        <Card>
          <CardHeader>
            <CardTitle>Programar reunión</CardTitle>
            <CardDescription>
              Registra fecha, hora, lugar y opcionalmente el enlace al acta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createMeeting}
              className="grid gap-4 md:grid-cols-2"
            >
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-700">Título</label>
                <Input
                  name="title"
                  placeholder="Reunión APMAE - Mayo 2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Inicio</label>
                <Input name="startsAt" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Fin (opcional)</label>
                <Input name="endsAt" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Lugar</label>
                <Input name="location" placeholder="Salón de actos" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">URL del acta</label>
                <Input name="minutesUrl" placeholder="https://..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-700">
                  Agenda (opcional)
                </label>
                <Input
                  name="agenda"
                  placeholder="Puntos a tratar en la reunión"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!canManage && (
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
          <span className="mt-0.5 text-sm">🔒</span>
          <p className="text-sm text-zinc-600">Tu rol permite ver reuniones, pero no gestionarlas.</p>
        </div>
      )}

      {/* ── Próximas reuniones ──────────────────────────── */}
      {upcoming.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            Próximas reuniones
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-start gap-4 pt-5">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <span className="text-xs font-medium uppercase">
                      {new Intl.DateTimeFormat("es-DO", {
                        month: "short",
                      }).format(m.startsAt)}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {m.startsAt.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{m.title}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Intl.DateTimeFormat("es-DO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(m.startsAt)}
                      </span>
                      {m.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {m.location}
                        </span>
                      )}
                    </div>
                    {m.agenda && (
                      <p className="text-sm text-zinc-500">
                        {m.agenda}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <form action={deleteMeeting}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Reuniones pasadas ───────────────────────────── */}
      {past.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
            Reuniones realizadas
          </h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>Reunión</TH>
                    <TH>Fecha</TH>
                    <TH>Lugar</TH>
                    <TH>Acta</TH>
                    {canManage && <TH className="text-right">Acciones</TH>}
                  </TR>
                </THead>
                <TBody>
                  {past
                    .slice()
                    .reverse()
                    .map((m) => (
                      <TR key={m.id}>
                        <TD className="font-medium">{m.title}</TD>
                        <TD className="text-zinc-600">
                          {new Intl.DateTimeFormat("es-DO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(m.startsAt)}
                        </TD>
                        <TD className="text-zinc-600">
                          {m.location ?? "—"}
                        </TD>
                        <TD>
                          {m.minutesUrl ? (
                            <a
                              href={m.minutesUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"
                            >
                              Ver acta
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <Badge variant="neutral">Sin acta</Badge>
                          )}
                        </TD>
                        {canManage && (
                          <TD className="text-right">
                            <form action={deleteMeeting}>
                              <input type="hidden" name="id" value={m.id} />
                              <Button
                                variant="ghost"
                                size="sm"
                                type="submit"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </form>
                          </TD>
                        )}
                      </TR>
                    ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {meetings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-zinc-600">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
            <p>No hay reuniones programadas para este año escolar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
