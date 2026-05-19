export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-blue text-white grid place-items-center font-semibold">
              PFM
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Escuela Prof. Felipe Montes Gómez</div>
              <div className="text-sm text-muted-foreground">Portal institucional</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a className="hover:text-brand-blue" href="/institucion/mision">
              Misión
            </a>
            <a className="hover:text-brand-blue" href="/institucion/vision">
              Visión
            </a>
            <a className="hover:text-brand-blue" href="/institucion/historia">
              Historia
            </a>
            <a className="hover:text-brand-blue" href="/servicios">
              Servicios
            </a>
            <a className="rounded-full bg-brand-gold px-4 py-2 font-medium text-black hover:opacity-90" href="/admin">
              Acceso personal
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-gradient-to-b from-white to-brand-blue/5">
        <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
          <div className="grid items-start gap-10 md:grid-cols-2">
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Educación con excelencia y valores
              </h1>
              <p className="text-lg text-muted-foreground">
                Bienvenidos a la Escuela Prof. Felipe Montes Gómez. Aquí encontrarás información
                institucional y, para el personal, un sistema administrativo seguro para la gestión
                académica.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="rounded-full bg-brand-blue px-5 py-3 text-sm font-medium text-white hover:opacity-95"
                  href="/institucion/historia"
                >
                  Conoce nuestra historia
                </a>
                <a
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium hover:bg-black/[.02]"
                  href="/servicios"
                >
                  Ver servicios
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="text-sm font-medium text-brand-blue">Fundación</div>
                <div className="mt-1 text-2xl font-semibold">2014</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Creada para servir con compromiso a la comunidad.
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="text-sm font-medium text-brand-blue">Servicios</div>
                <div className="mt-1 text-2xl font-semibold">2+</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Tanda Extendida y Comedor escolar, entre otros.
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:col-span-2">
                <div className="text-sm font-medium text-brand-blue">Sistema administrativo</div>
                <div className="mt-1 text-2xl font-semibold">Acceso seguro</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Gestión de personal, alumnado, asistencia, documentos y métricas.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Escuela Prof. Felipe Montes Gómez
        </div>
      </footer>
    </div>
  );
}
