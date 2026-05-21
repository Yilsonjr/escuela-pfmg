import {
  ArrowRight,
  BookOpen,
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
} from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: GraduationCap,
    title: "Excelencia Académica",
    desc: "Currículo actualizado con metodologías activas y docentes comprometidos con el aprendizaje continuo.",
    accent: "gold" as const,
  },
  {
    icon: Brain,
    title: "Apoyo Psicológico",
    desc: "Equipo de psicólogos para el bienestar emocional y el desarrollo integral de cada estudiante.",
    accent: "blue" as const,
  },
  {
    icon: Clock,
    title: "Tanda Extendida",
    desc: "Horario ampliado con actividades extracurriculares y refuerzo académico personalizado.",
    accent: "gold" as const,
  },
  {
    icon: Utensils,
    title: "Comedor Escolar",
    desc: "Alimentación nutritiva y balanceada para garantizar el rendimiento y la salud de los estudiantes.",
    accent: "blue" as const,
  },
  {
    icon: Users,
    title: "Comunidad APMAE",
    desc: "Asociación activa de padres que fortalece el vínculo entre familia, escuela y comunidad.",
    accent: "gold" as const,
  },
  {
    icon: FileText,
    title: "Gestión Documental",
    desc: "Acceso rápido a certificaciones, registros académicos y documentos oficiales del estudiante.",
    accent: "blue" as const,
  },
];

const stats = [
  { value: "2014", label: "Año de Fundación", color: "text-brand-blue" },
  { value: "+500", label: "Estudiantes Activos", color: "text-brand-gold" },
  { value: "25+", label: "Docentes Calificados", color: "text-brand-blue" },
  { value: "100%", label: "Compromiso Docente", color: "text-brand-gold" },
];

const pillars = [
  {
    icon: Shield,
    title: "Valores Humanos",
    desc: "Formamos ciudadanos con ética, respeto y responsabilidad social.",
  },
  {
    icon: GraduationCap,
    title: "Calidad Académica",
    desc: "Metodologías activas y docentes especializados en cada área de aprendizaje.",
  },
  {
    icon: Heart,
    title: "Bienestar Integral",
    desc: "Atención emocional, física y social para cada estudiante de nuestra comunidad.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans selection:bg-brand-gold selection:text-brand-navy">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-brand-navy/98 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-gold/30 bg-brand-gold/10 text-brand-gold transition-all group-hover:bg-brand-gold group-hover:text-brand-navy">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-white">Escuela Primaria</p>
              <p className="mt-0.5 text-xs font-medium text-brand-gold">
                Prof. Felipe Montes Gómez
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="#servicios"
              className="text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              Servicios
            </Link>
            <Link
              href="#nosotros"
              className="text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              Nosotros
            </Link>
            <Link
              href="#contacto"
              className="text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              Contacto
            </Link>
            <Link
              href="/admin"
              className="group ml-2 flex items-center gap-2 rounded-full bg-brand-gold px-5 py-2.5 text-sm font-bold text-brand-navy shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-gold-light hover:shadow-lg hover:shadow-brand-gold/25"
            >
              Acceso Personal
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative flex min-h-screen items-center overflow-hidden bg-brand-navy px-6 py-24">
          {/* Dot pattern */}
          <div className="hero-pattern absolute inset-0 pointer-events-none" />

          {/* Gold top accent line */}
          <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-brand-gold/90 via-brand-gold/30 to-transparent" />

          {/* Ambient glows */}
          <div className="pointer-events-none absolute -top-32 right-0 h-[480px] w-[480px] rounded-full bg-brand-blue/30 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-brand-gold/5 blur-[80px]" />

          {/* Decorative large number */}
          <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none text-[18rem] font-black leading-none text-white/[0.02] xl:block">
            PFM
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <div className="grid items-center gap-14 lg:grid-cols-[1fr_420px]">

              {/* Left – headline */}
              <div className="animate-fade-in space-y-8 max-w-2xl">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-brand-gold/20 bg-brand-gold/8 px-4 py-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-gold" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-gold">
                    Educación Integral · Desde 2014
                  </span>
                </div>

                <h1 className="text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
                  Donde cada niño
                  <br />
                  <span className="italic text-brand-gold">descubre</span> su
                  <br />
                  potencial.
                </h1>

                <p className="max-w-lg text-base leading-relaxed text-white/45 sm:text-lg">
                  Una escuela que combina educación de calidad, valores humanos
                  y tecnología para formar a los ciudadanos del mañana.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/admin"
                    className="group flex items-center gap-2.5 rounded-full bg-brand-gold px-7 py-3.5 text-sm font-bold text-brand-navy shadow-lg shadow-brand-gold/20 transition-all hover:-translate-y-1 hover:shadow-brand-gold/35 hover:shadow-xl"
                  >
                    Portal Administrativo
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="#servicios"
                    className="rounded-full border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-medium text-white/65 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    Ver Servicios
                  </Link>
                </div>
              </div>

              {/* Right – commitment card */}
              <div className="animate-slide-up relative">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-6 shadow-2xl shadow-black/30 ring-1 ring-inset ring-white/5 backdrop-blur-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                        Nuestro Compromiso
                      </p>
                      <p className="mt-0.5 text-base font-bold text-white">
                        4 pilares fundamentales
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/10">
                      <Shield className="h-5 w-5 text-brand-gold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      "Desarrollo académico de alto nivel",
                      "Acompañamiento psicológico continuo",
                      "Programa de tanda extendida",
                      "Comedor escolar con nutrición balanceada",
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-gold/35 bg-brand-gold/10 text-[10px] font-bold text-brand-gold">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-white/65">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-gold/20 bg-brand-gold/8 px-4 py-3">
                    <span className="text-xs font-medium text-brand-gold/80">
                      Compromiso docente verificado
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className="h-3.5 w-3.5 fill-brand-gold text-brand-gold"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="animate-float absolute -bottom-5 -left-5 rounded-2xl bg-brand-gold px-5 py-3.5 shadow-xl shadow-brand-gold/30">
                  <p className="text-2xl font-black leading-none text-brand-navy">
                    +500
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-brand-navy/60">
                    Estudiantes Activos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave into white */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 56L80 46.7C160 37 320 19 480 14C640 9 800 16 960 25.7C1120 35 1280 46 1360 51.3L1440 56H1360C1280 56 1120 56 960 56C800 56 640 56 480 56C320 56 160 56 80 56H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="bg-white px-6 pb-20 pt-2">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-brand-blue/8 ring-1 ring-brand-blue/8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white px-8 py-8 text-center transition-colors hover:bg-brand-sky/30"
                >
                  <div className={`text-4xl font-black ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="mt-1.5 text-xs font-medium uppercase tracking-wide text-brand-blue-light/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section id="servicios" className="bg-brand-cream px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8 bg-brand-gold" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
                    Servicios Estudiantiles
                  </span>
                </div>
                <h2 className="text-4xl font-black leading-tight text-brand-blue sm:text-5xl">
                  Educación completa
                  <br />
                  <span className="italic text-brand-blue-light">
                    en cada aspecto.
                  </span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-right">
                Brindamos un ecosistema educativo que atiende al estudiante
                desde múltiples dimensiones.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(({ icon: Icon, title, desc, accent }, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                    ${
                      accent === "gold"
                        ? "border-brand-gold/10 hover:border-brand-gold/30 hover:shadow-brand-gold/8"
                        : "border-brand-blue/8 hover:border-brand-blue/20 hover:shadow-brand-blue/6"
                    }`}
                >
                  <div
                    className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300
                      ${
                        accent === "gold"
                          ? "bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-white group-hover:shadow-md group-hover:shadow-brand-gold/25"
                          : "bg-brand-blue/8 text-brand-blue group-hover:bg-brand-blue group-hover:text-white group-hover:shadow-md group-hover:shadow-brand-blue/25"
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-brand-blue">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                  <div
                    className={`mt-5 flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100
                      ${accent === "gold" ? "text-brand-gold" : "text-brand-blue"}`}
                  >
                    <span>Conocer más</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About / Mission ── */}
        <section id="nosotros" className="overflow-hidden bg-white px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-2">

              {/* Visual card */}
              <div className="relative order-2 lg:order-1">
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-10 shadow-2xl shadow-brand-navy/20">
                  <div className="hero-pattern absolute inset-0 opacity-70" />
                  <div className="relative z-10">
                    <div className="select-none text-[7rem] font-black leading-none text-white/5">
                      10
                    </div>
                    <div className="-mt-6 mb-6">
                      <p className="text-5xl font-black text-white">Años</p>
                      <p className="text-lg font-medium text-brand-gold">
                        formando el futuro
                      </p>
                    </div>
                    <div className="mb-6 h-px bg-white/8" />
                    <p className="mb-8 text-sm leading-relaxed text-white/45">
                      Desde 2014, la Escuela Primaria Prof. Felipe Montes
                      Gómez es un pilar educativo en la comunidad, comprometida
                      con la formación integral de cada estudiante.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Docentes calificados", value: "25+" },
                        { label: "Promociones graduadas", value: "10+" },
                        { label: "Programas activos", value: "6" },
                        { label: "Años de trayectoria", value: "11" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-white/8 bg-white/5 p-4"
                        >
                          <p className="text-2xl font-black text-brand-gold">
                            {item.value}
                          </p>
                          <p className="mt-1 text-xs text-white/40">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Corner accents */}
                <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-2xl border border-brand-gold/20 bg-brand-gold/8" />
                <div className="absolute -left-4 -top-4 h-14 w-14 rounded-xl border border-brand-blue/10 bg-brand-sky/60" />
              </div>

              {/* Content */}
              <div className="order-1 space-y-8 lg:order-2">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px w-8 bg-brand-gold" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
                      Nuestra Misión
                    </span>
                  </div>
                  <h2 className="text-4xl font-black leading-tight text-brand-blue sm:text-5xl">
                    Educamos con propósito,
                    <br />
                    <span className="italic text-brand-blue-light">
                      crecemos en comunidad.
                    </span>
                  </h2>
                </div>

                <p className="text-base leading-relaxed text-muted-foreground">
                  Brindar una educación integral, inclusiva y de calidad que
                  prepare a nuestros estudiantes para los retos del mundo
                  actual, cultivando valores, habilidades y el máximo
                  potencial humano de cada niño.
                </p>

                <div className="space-y-3">
                  {pillars.map(({ icon: Icon, title, desc }, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-4 rounded-xl border border-transparent bg-brand-sky/25 p-4 transition-all hover:border-brand-blue/8 hover:bg-brand-sky/50"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/8 text-brand-blue transition-all group-hover:bg-brand-blue group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-blue">
                          {title}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          id="contacto"
          className="relative overflow-hidden bg-brand-navy px-6 py-24"
        >
          <div className="hero-pattern absolute inset-0 pointer-events-none" />
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/25 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-brand-gold/6 blur-[80px]" />

          <div className="relative z-10 mx-auto max-w-3xl space-y-8 text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-brand-gold/20 bg-brand-gold/8 px-4 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold">
                Portal Institucional
              </span>
            </div>

            <h2 className="text-4xl font-black text-white sm:text-5xl">
              ¿Eres parte de nuestro
              <br />
              <span className="italic text-brand-gold">equipo docente?</span>
            </h2>

            <p className="mx-auto max-w-lg text-base text-white/40">
              Accede al sistema administrativo para gestionar estudiantes,
              asistencia, documentos y métricas institucionales.
            </p>

            <Link
              href="/admin"
              className="group inline-flex items-center gap-3 rounded-full bg-brand-gold px-8 py-4 text-base font-bold text-brand-navy shadow-lg shadow-brand-gold/20 transition-all hover:-translate-y-1 hover:shadow-brand-gold/40 hover:shadow-xl"
            >
              Acceder al Portal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="grid grid-cols-1 gap-3 border-t border-white/8 pt-8 sm:grid-cols-3">
              {[
                { icon: MapPin, value: "República Dominicana" },
                { icon: Phone, value: "Llámenos hoy" },
                { icon: Mail, value: "info@escuela.edu.do" },
              ].map(({ icon: Icon, value }, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 text-sm text-white/30 transition-colors hover:text-white/50"
                >
                  <Icon className="h-4 w-4 text-brand-gold/45" />
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-black/5 bg-white px-6 py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue/8">
              <BookOpen className="h-3.5 w-3.5 text-brand-blue" />
            </div>
            <span className="text-sm font-semibold text-brand-blue">
              Escuela Primaria Prof. Felipe Montes Gómez
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} · Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
