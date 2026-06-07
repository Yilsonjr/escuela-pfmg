import Link from "next/link";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  ShieldCheck,
  UserX,
  ArrowRight,
} from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ── Helpers ───────────────────────────────────────────────── */

function pct(n: number, total: number) {
  if (total === 0) return "0";
  return ((n / total) * 100).toFixed(1);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function AdminHome() {
  const session = await requireAuth();
  const userName = session?.user?.name ?? session?.user?.email ?? "Usuario";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeEnrollments,
    withdrawnCount,
    todayAttendance,
    openAlerts,
    redAlerts,
    yellowAlerts,
    staffCount,
    gradeStats,
    recentAlerts,
  ] = await Promise.all([
    prisma.enrollment.count({ where: { status: "ACTIVO" } }),
    prisma.enrollment.count({ where: { status: "RETIRADO" } }),
    prisma.attendanceRecord.findMany({
      where: { date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
      select: { status: true },
    }),
    prisma.alert.count({ where: { status: "ABIERTA" } }),
    prisma.alert.count({ where: { severity: "ROJO", status: { not: "CERRADA" } } }),
    prisma.alert.count({ where: { severity: "AMARILLO", status: { not: "CERRADA" } } }),
    prisma.staff.count({ where: { isActive: true } }),
    prisma.enrollment.groupBy({
      by: ["sectionId"],
      where: { status: "ACTIVO" },
      _count: true,
    }),
    prisma.alert.findMany({
      where: { status: { not: "CERRADA" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { student: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const presentToday  = todayAttendance.filter((a) => a.status === "PRESENTE").length;
  const absentToday   = todayAttendance.filter((a) => a.status === "AUSENTE").length;
  const lateToday     = todayAttendance.filter((a) => a.status === "TARDE").length;
  const totalToday    = todayAttendance.length;
  const attendanceRate = totalToday > 0 ? pct(presentToday + lateToday, totalToday) : "—";

  // Grade breakdown
  const sections = await prisma.section.findMany({ include: { grade: true } });
  const gradeMap = new Map<string, { name: string; order: number; count: number }>();
  for (const s of sections) {
    const gs = gradeStats.find((g) => g.sectionId === s.id);
    const existing = gradeMap.get(s.grade.code);
    if (existing) {
      existing.count += gs?._count ?? 0;
    } else {
      gradeMap.set(s.grade.code, { name: s.grade.name, order: s.grade.order, count: gs?._count ?? 0 });
    }
  }
  const gradeBreakdown = Array.from(gradeMap.values()).sort((a, b) => a.order - b.order);

  const quickLinks = [
    { href: "/admin/alumnado",   label: "Alumnado",    icon: GraduationCap, bg: "bg-brand-blue/10",   color: "text-brand-blue"   },
    { href: "/admin/asistencia", label: "Asistencia",  icon: CalendarCheck,  bg: "bg-emerald-100",     color: "text-emerald-700"  },
    { href: "/admin/alertas",    label: "Alertas",     icon: AlertTriangle,  bg: "bg-amber-100",       color: "text-amber-700"    },
    { href: "/admin/personal",   label: "Personal",    icon: Users,          bg: "bg-violet-100",      color: "text-violet-700"   },
  ];

  return (
    <div className="space-y-8">

      {/* ── Greeting ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-blue">
          {greeting()}, {userName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-base text-zinc-500">
          {today.toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

        {/* Alumnos activos */}
        <Card>
          <CardContent>
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10">
                <GraduationCap className="h-6 w-6 text-brand-blue" />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-brand-blue">{activeEnrollments}</p>
            <p className="mt-1.5 text-sm font-semibold text-zinc-700">Alumnos activos</p>
            {withdrawnCount > 0 ? (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                <UserX className="h-3 w-3" /> {withdrawnCount} retirado{withdrawnCount > 1 ? "s" : ""}
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">matriculados este año</p>
            )}
          </CardContent>
        </Card>

        {/* Asistencia hoy */}
        <Card>
          <CardContent>
            <div className="flex items-start justify-between mb-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                attendanceRate !== "—" && parseFloat(attendanceRate) >= 90 ? "bg-emerald-100"
                : attendanceRate !== "—" && parseFloat(attendanceRate) >= 75 ? "bg-amber-100"
                : "bg-zinc-100"
              }`}>
                <CalendarCheck className={`h-6 w-6 ${
                  attendanceRate !== "—" && parseFloat(attendanceRate) >= 90 ? "text-emerald-700"
                  : attendanceRate !== "—" && parseFloat(attendanceRate) >= 75 ? "text-amber-700"
                  : "text-zinc-400"
                }`} />
              </div>
            </div>
            <p className={`text-4xl font-bold tracking-tight ${
              attendanceRate === "—" ? "text-zinc-300"
              : parseFloat(attendanceRate) >= 90 ? "text-emerald-700"
              : parseFloat(attendanceRate) >= 75 ? "text-amber-700"
              : "text-red-700"
            }`}>
              {attendanceRate === "—" ? "—" : `${attendanceRate}%`}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-zinc-700">Asistencia hoy</p>
            {totalToday > 0 ? (
              <p className="mt-1 text-xs text-zinc-500">{presentToday} pres. · {lateToday} tardes · {absentToday} aus.</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">Sin registros aún</p>
            )}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardContent>
            <div className="flex items-start justify-between mb-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                redAlerts > 0 ? "bg-red-100" : openAlerts > 0 ? "bg-amber-100" : "bg-emerald-100"
              }`}>
                {redAlerts === 0 && openAlerts === 0
                  ? <ShieldCheck className="h-6 w-6 text-emerald-700" />
                  : <AlertTriangle className={`h-6 w-6 ${redAlerts > 0 ? "text-red-700" : "text-amber-700"}`} />
                }
              </div>
            </div>
            <p className={`text-4xl font-bold tracking-tight ${
              redAlerts > 0 ? "text-red-700" : openAlerts > 0 ? "text-amber-700" : "text-emerald-700"
            }`}>{openAlerts}</p>
            <p className="mt-1.5 text-sm font-semibold text-zinc-700">Alertas abiertas</p>
            <div className="mt-1 flex items-center gap-1.5">
              {redAlerts > 0 && <Badge variant="red">{redAlerts} roja{redAlerts > 1 ? "s" : ""}</Badge>}
              {yellowAlerts > 0 && <Badge variant="yellow">{yellowAlerts} amarilla{yellowAlerts > 1 ? "s" : ""}</Badge>}
              {redAlerts === 0 && yellowAlerts === 0 && (
                <p className="text-xs font-medium text-emerald-700">✓ Todo en orden</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal */}
        <Card>
          <CardContent>
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                <Users className="h-6 w-6 text-violet-700" />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-violet-700">{staffCount}</p>
            <p className="mt-1.5 text-sm font-semibold text-zinc-700">Personal activo</p>
            <p className="mt-1 text-xs text-zinc-400">colaboradores en el centro</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Grade breakdown + Recent alerts ──────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Alumnos por grado */}
        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-800">Alumnos por grado</h3>
              <Link href="/admin/alumnado" className="flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {gradeBreakdown.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No hay alumnos matriculados aún</p>
            ) : (
              <div className="space-y-4">
                {gradeBreakdown.map((g) => {
                  const isEmpty = g.count === 0;
                  const pctWidth = activeEnrollments > 0 && !isEmpty
                    ? (g.count / activeEnrollments) * 100
                    : 0;
                  return (
                    <div key={g.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-700">{g.name}</span>
                        <span className={`text-sm font-medium ${isEmpty ? "text-zinc-400" : "text-zinc-600"}`}>
                          {g.count} alumno{g.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {isEmpty ? (
                        <div className="h-2.5 w-full rounded-full border border-dashed border-zinc-300 bg-zinc-50" />
                      ) : (
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-blue/10">
                          <div
                            className="h-full rounded-full bg-brand-blue transition-all"
                            style={{ width: `${pctWidth}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas recientes */}
        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-800">Alertas recientes</h3>
              <Link href="/admin/alertas" className="flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-3">
                  <ShieldCheck className="h-7 w-7 text-emerald-700" />
                </div>
                <p className="text-sm font-semibold text-zinc-700">No hay alertas abiertas</p>
                <p className="mt-1 text-xs text-zinc-400">El centro está al día</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                    <div className={`h-3 w-3 shrink-0 rounded-full ${
                      alert.severity === "ROJO" ? "bg-red-500"
                      : alert.severity === "AMARILLO" ? "bg-amber-500"
                      : "bg-emerald-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 truncate">{alert.title}</p>
                      {alert.student && (
                        <p className="text-xs text-zinc-500">
                          {alert.student.firstName} {alert.student.lastName}
                        </p>
                      )}
                    </div>
                    <Badge variant={
                      alert.status === "ABIERTA" ? "red"
                      : alert.status === "EN_SEGUIMIENTO" ? "yellow"
                      : "green"
                    }>
                      {alert.status === "EN_SEGUIMIENTO" ? "Seguimiento"
                        : alert.status.charAt(0) + alert.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick access ─────────────────────────────────────── */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-zinc-700">Accesos rápidos</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-brand-blue/20">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${link.bg}`}>
                    <link.icon className={`h-6 w-6 ${link.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-700 group-hover:text-brand-blue transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
