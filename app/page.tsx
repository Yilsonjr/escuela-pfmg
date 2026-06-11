import {
  ArrowRight,
  Users,
  Shield,
  GraduationCap,
  Heart,
  Clock,
  Utensils,
  Brain,
  FileText,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Star,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import { getSchoolProfile } from "@/lib/school-profile";

/* ─── Data ─────────────────────────────────────────────────── */

const services = [
  {
    icon: GraduationCap,
    title: "Excelencia Académica",
    desc: "Currículo actualizado por el MINERD con refuerzo personalizado y seguimiento individual del rendimiento de cada estudiante.",
  },
  {
    icon: Brain,
    title: "Apoyo Psicológico",
    desc: "Psicólogos especializados que atienden a estudiantes y familias en situaciones emocionales y de aprendizaje.",
  },
  {
    icon: Clock,
    title: "Tanda Extendida",
    desc: "Horario hasta las 5:00 PM con refuerzo académico y actividades extracurriculares.",
  },
  {
    icon: Utensils,
    title: "Comedor Escolar",
    desc: "Menú diseñado por nutricionistas. Tres comidas diarias con valor energético certificado.",
  },
  {
    icon: Users,
    title: "Comunidad APMAE",
    desc: "Asociación activa de padres con reuniones periódicas y canal directo con la dirección.",
  },
  {
    icon: FileText,
    title: "Gestión Documental",
    desc: "Solicitud de certificaciones y constancias oficiales de manera ágil y digital en menos de 48 horas.",
  },
];

const pillars = [
  {
    icon: Shield,
    title: "Valores Humanos",
    desc: "Ética, respeto y responsabilidad social integrados al currículo desde el primer grado mediante proyectos comunitarios.",
  },
  {
    icon: GraduationCap,
    title: "Calidad Académica",
    desc: "Maestros titulados con capacitación trimestral, planificación diferenciada y tecnología educativa.",
  },
  {
    icon: Heart,
    title: "Bienestar Integral",
    desc: "Psicólogos, nutricionistas y orientadores trabajan en equipo para atender la salud emocional y física de cada niño.",
  },
];

const testimonials = [
  {
    initials: "MR",
    name: "María Rodríguez",
    role: "Mamá de estudiante",
    quote:
      "Desde que mi hijo entró, su desarrollo académico y emocional ha sido extraordinario. Los maestros se preocupan genuinamente por cada niño. Es una escuela que siente como familia.",
  },
  {
    initials: "JP",
    name: "Juan Pérez",
    role: "Papá de estudiante",
    quote:
      "La tanda extendida ha sido clave para nosotros. Mi hija llega a casa con las tareas hechas y habiendo comido bien.",
  },
  {
    initials: "CS",
    name: "Carmen Santos",
    role: "Mamá de estudiante",
    quote:
      "El apoyo psicológico marcó una diferencia real. Mi hijo pasó de tener dificultades a ser uno de los más destacados de su aula.",
  },
];

/* ─── Page ──────────────────────────────────────────────────── */

export default async function Home() {
  let studentCount = 0;
  let staffCount = 0;
  let activeYearLabel = siteConfig.currentSchoolYear;

  const profile = await getSchoolProfile();

  try {
    const [students, staff, activeYear] = await Promise.all([
      prisma.student.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.schoolYear.findFirst({ where: { isActive: true }, select: { label: true } }),
    ]);
    studentCount = students;
    staffCount   = staff;
    if (activeYear?.label) activeYearLabel = activeYear.label;
  } catch {
    // DB unreachable — usar valores de fallback
  }
  const yearsOfHistory = new Date().getFullYear() - profile.foundedYear;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans selection:bg-brand-gold/20 selection:text-brand-blue">
      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden border border-zinc-100 bg-white shadow-sm transition-shadow group-hover:shadow-md p-0.5">
              <Image
                src="/logo.png"
                alt="Logo Escuela"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold text-brand-blue">
                {profile.shortName}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {profile.subtitle}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {[
              { label: "Servicios", href: "#servicios" },
              { label: "Nosotros", href: "#nosotros" },
              { label: "Testimonios", href: "#testimonios" },
              { label: "Contacto", href: "#contacto" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded text-sm text-zinc-500 transition-colors hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="hidden rounded text-sm text-zinc-400 transition-colors hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 sm:block"
            >
              Portal docente
            </Link>
            <Link
              href="#contacto"
              className="rounded-full bg-brand-blue px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              Inscripciones
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ══ HERO ════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-brand-navy px-6 pb-20 pt-16 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand-blue/15 blur-[120px]" />
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/25 to-transparent" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Left */}
              <div className="space-y-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-white/60">
                    Inscripciones abiertas {activeYearLabel}
                  </span>
                </div>

                <h1 className="text-balance font-headline text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
                  Educación de calidad para tu hijo,{" "}
                  <span className="font-display italic text-brand-gold">
                    en el corazón de la comunidad.
                  </span>
                </h1>

                <p className="max-w-lg text-base leading-relaxed text-white/60">
                  Desde {profile.foundedYear} formamos niños con excelencia académica, valores
                  sólidos y acompañamiento integral. Más de {studentCount || 500} familias confían
                  en nosotros.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#servicios"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-gold px-7 py-3.5 text-sm font-semibold text-brand-navy transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                  >
                    Conocer la escuela
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="#contacto"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm text-white/60 transition-[border-color,color] hover:border-white/30 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                  >
                    Contactar
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>

              {/* Right — key facts, clean and readable */}
              <div className="hidden lg:block">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-sm">
                  <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-white/40">
                    Nuestra escuela en números
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { value: studentCount > 0 ? `+${studentCount}` : "+500", label: "Estudiantes activos" },
                      { value: String(staffCount || 28), label: "Docentes titulados" },
                      { value: profile.approvalRate, label: "Tasa de aprobación" },
                      { value: String(yearsOfHistory), label: "Años de historia" },
                    ].map(({ value, label }) => (
                      <div key={label}>
                        <p className="font-headline text-3xl font-bold tabular-nums text-white">
                          {value}
                        </p>
                        <p className="mt-1 text-sm text-white/45">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-3">
                    <Star
                      className="h-4 w-4 shrink-0 fill-brand-gold text-brand-gold"
                      strokeWidth={1.5}
                    />
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        Reconocida por MINERD
                      </p>
                      <p className="text-xs text-white/40">
                        Escuela de excelencia académica · 2023
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SERVICIOS ═══════════════════════════════════════════ */}
        <section id="servicios" className="bg-white px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-blue/50">
                Servicios estudiantiles
              </p>
              <h2 className="text-balance font-headline text-3xl font-bold leading-tight text-brand-blue sm:text-4xl">
                Todo lo que tu hijo necesita,{" "}
                <span className="font-display italic text-brand-blue-light">
                  en un solo lugar.
                </span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                Un ecosistema educativo pensado para el desarrollo integral de
                cada niño.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-zinc-100 bg-white p-7 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-100/80"
                >
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-sky text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-zinc-800">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MISIÓN / PILARES ════════════════════════════════════ */}
        <section id="nosotros" className="bg-brand-cream px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-blue/50">
                Nuestra misión
              </p>
              <h2 className="text-balance font-headline text-3xl font-bold leading-tight text-brand-blue sm:text-4xl">
                Formamos niños seguros,{" "}
                <span className="font-display italic text-brand-blue-light">
                  capaces y comprometidos
                </span>{" "}
                con su entorno.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                Cada decisión está orientada al desarrollo pleno del niño:
                académico, emocional y social.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {pillars.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-brand-warm-2 bg-white p-8"
                >
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-800">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-14 grid grid-cols-2 gap-6 border-t border-brand-warm-2 pt-10 sm:grid-cols-4">
              {[
                { value: String(profile.foundedYear), label: "Año de fundación" },
                { value: studentCount > 0 ? `+${studentCount}` : "+500", label: "Familias activas" },
                { value: `${staffCount || 25}+`, label: "Docentes certificados" },
                { value: profile.approvalRate, label: "Tasa de aprobación" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="font-headline text-2xl font-bold tabular-nums text-brand-blue">
                    {value}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIOS ════════════════════════════════════════ */}
        <section id="testimonios" className="bg-white px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-brand-blue/50">
                Testimonios
              </p>
              <h2 className="text-balance font-headline text-3xl font-bold leading-tight text-brand-blue sm:text-4xl">
                Lo que dicen{" "}
                <span className="font-display italic text-brand-blue-light">
                  nuestras familias.
                </span>
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map(({ initials, name, role, quote }) => (
                <div
                  key={name}
                  className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-7 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-100/80"
                >
                  <div className="mb-4 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className="h-4 w-4 fill-brand-gold text-brand-gold"
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-zinc-600">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-zinc-50 pt-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        {name}
                      </p>
                      <p className="text-xs text-zinc-400">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA / CONTACTO ══════════════════════════════════════ */}
        <section
          id="contacto"
          className="bg-brand-blue px-6 py-20 lg:py-28"
        >
          <div className="mx-auto max-w-3xl space-y-7 text-center">
            <h2 className="text-balance font-headline text-3xl font-bold leading-tight text-white sm:text-4xl">
              Dale a tu hijo la mejor{" "}
              <span className="font-display italic text-brand-gold">
                educación de la comunidad.
              </span>
            </h2>

            <p className="mx-auto max-w-md text-base leading-relaxed text-white/60">
              Contáctanos para conocer el proceso de inscripción, requisitos y
              disponibilidad para el nuevo año escolar.
            </p>

            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
              <Link
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-semibold text-brand-blue transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue"
              >
                Iniciar inscripción
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm text-white/70 transition-[border-color,color] hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue"
              >
                Portal docente
              </Link>
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-center sm:gap-8">
              {[
                { icon: MapPin, value: profile.location },
                { icon: Phone, value: profile.phone },
                { icon: Mail, value: profile.email },
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="flex items-center gap-2 text-sm text-white/50"
                >
                  <Icon className="h-4 w-4 text-white/35" strokeWidth={1.5} />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-zinc-100 bg-zinc-50 px-6 pb-8 pt-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-white border border-zinc-200 shadow-sm p-0.5">
                  <Image
                    src="/logo.png"
                    alt="Logo Escuela"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-blue">
                    {profile.shortName}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {profile.subtitle}
                  </p>
                </div>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                Formando niños con excelencia académica, valores humanos y
                bienestar integral desde {profile.foundedYear}.
              </p>
              <div className="space-y-2">
                {[
                  { icon: MapPin, label: profile.location },
                  { icon: Phone, label: profile.phone },
                  { icon: Mail, label: profile.email },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-sm text-zinc-400"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Institución
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Servicios", href: "#servicios" },
                  { label: "Nuestra misión", href: "#nosotros" },
                  { label: "Testimonios", href: "#testimonios" },
                  { label: "Contacto", href: "#contacto" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-500 transition-colors hover:text-brand-blue"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Accesos
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Portal docente", href: "/admin" },
                  { label: "Gestión documental", href: "/admin" },
                  { label: "Proceso de inscripción", href: "#contacto" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-500 transition-colors hover:text-brand-blue"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-400 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {profile.name} · Todos los
              derechos reservados
            </p>
            <Link
              href="/admin"
              className="text-zinc-400 transition-colors hover:text-brand-blue"
            >
              Portal docente →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
