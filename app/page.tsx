import { ArrowRight, BookOpen, Users, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans selection:bg-brand-gold selection:text-brand-blue">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue-light to-brand-blue text-white shadow-lg shadow-brand-blue/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold text-brand-blue">Escuela Primaria</div>
              <div className="text-sm font-medium text-brand-gold">Prof. Felipe Montes Gómez</div>
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link className="text-muted-foreground transition-colors hover:text-brand-blue" href="/institucion/historia">
              Nuestra Historia
            </Link>
            <Link className="text-muted-foreground transition-colors hover:text-brand-blue" href="/servicios">
              Servicios Estudiantiles
            </Link>
            <Link
              className="group flex items-center gap-2 rounded-full bg-brand-gold px-6 py-2.5 text-brand-blue font-bold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-gold/20"
              href="/admin"
            >
              Acceso Personal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section con gradiente invertido y ondas */}
        <section className="relative overflow-hidden bg-brand-blue px-6 py-24 md:py-32 lg:py-40">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-sky via-brand-blue to-brand-blue"></div>
          
          <div className="mx-auto max-w-7xl relative z-10 grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="max-w-2xl animate-fade-in space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-brand-gold-light backdrop-blur-sm border border-white/10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-gold"></span>
                </span>
                Educación Integral desde 2014
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-tight">
                Forjando el futuro con <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-light to-brand-gold">excelencia y valores</span>
              </h1>
              
              <p className="text-lg leading-relaxed text-brand-sky/80 md:text-xl">
                Bienvenidos a nuestro portal institucional. Brindamos una educación de calidad, enfocada en el desarrollo humano, académico y social de nuestros estudiantes.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  className="rounded-full bg-brand-gold px-8 py-4 text-base font-bold text-brand-blue shadow-lg transition-all hover:-translate-y-1 hover:shadow-brand-gold/25"
                  href="/admin"
                >
                  Sistema Administrativo
                </Link>
                <Link
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
                  href="/servicios"
                >
                  Ver Servicios
                </Link>
              </div>
            </div>

            {/* Ilustración o tarjetas flotantes */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none animate-slide-up">
              <div className="relative rounded-3xl bg-white p-8 shadow-2xl shadow-black/20">
                <div className="absolute -left-6 -top-6 animate-float rounded-2xl bg-brand-gold p-4 shadow-xl">
                  <Shield className="h-8 w-8 text-brand-blue" />
                </div>
                <div className="absolute -bottom-6 -right-6 animate-float" style={{ animationDelay: "2s" }}>
                  <div className="rounded-2xl bg-brand-blue-light p-4 shadow-xl">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h3 className="mb-6 text-2xl font-bold text-brand-blue">Nuestro Compromiso</h3>
                <ul className="space-y-5">
                  {[
                    "Desarrollo académico de alto nivel",
                    "Acompañamiento psicológico continuo",
                    "Programa de tanda extendida",
                    "Comedor escolar con nutrición balanceada"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-brand-gold" />
                      <span className="text-muted-foreground font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 rounded-3xl bg-brand-sky/30 p-8 sm:grid-cols-3 md:p-12">
              <div className="text-center">
                <div className="text-5xl font-extrabold text-brand-blue">2014</div>
                <div className="mt-2 font-medium text-brand-blue-light">Año de Fundación</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-extrabold text-brand-gold">+500</div>
                <div className="mt-2 font-medium text-brand-blue-light">Estudiantes Activos</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-extrabold text-brand-blue">100%</div>
                <div className="mt-2 font-medium text-brand-blue-light">Compromiso Docente</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-blue" />
            <span className="font-semibold text-brand-blue">Escuela Primaria Prof. Felipe Montes Gómez</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
