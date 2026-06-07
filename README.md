# Escuela Primaria Prof. Felipe Montes Gómez

Portal informativo y sistema de gestión administrativa para la **Escuela Primaria Prof. Felipe Montes Gómez**, República Dominicana.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss)

---

## Descripción

Sistema web completo que combina:

- **Portal público** — Información del centro, servicios, y contacto para padres y comunidad
- **Portal administrativo** — Gestión interna para directivos y docentes con control de acceso por roles (RBAC)

---

## Módulos del portal administrativo

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | KPIs en tiempo real: alumnos activos, asistencia del día, alertas abiertas |
| **Personal** | Registro y gestión del personal docente y administrativo |
| **Alumnado** | Matrícula de estudiantes con importación directa desde SIGERD (MINERD) |
| **Asistencia** | Registro diario por sección con semáforo de riesgo de inasistencia |
| **Alertas** | Seguimiento de estudiantes en riesgo (AMARILLO / ROJO) con ciclo de vida completo |
| **Documentos** | Repositorio de circulares, actas, formatos y manuales del centro |
| **Métricas** | Indicadores anuales: tasa de promoción, abandono, repitencia y asistencia por grado |
| **APMAE** | Calendario de reuniones de la Asociación de Padres con actas y agenda |
| **Configuración** | Activar/desactivar módulos del portal (solo Directora) |
| **Perfil** | Cambio de contraseña seguro por parte del usuario |

---

## Tecnologías

- **Framework:** Next.js 16 (App Router, Server Actions, Turbopack)
- **Lenguaje:** TypeScript 5
- **Base de datos:** PostgreSQL en Supabase (PgBouncer pooler)
- **ORM:** Prisma 7 con PrismaPg adapter
- **Autenticación:** NextAuth.js con estrategia JWT y bcryptjs
- **Estilos:** Tailwind CSS 4 con `@theme inline`
- **Iconos:** Lucide React

---

## Requisitos previos

- Node.js 20+
- Cuenta en [Supabase](https://supabase.com) con proyecto PostgreSQL activo

---

## Configuración local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Yilsonjr/escuela-pfmg.git
cd escuela-pfmg
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase — Pooler para runtime (puerto 6543)
DATABASE_URL="postgresql://postgres.TUREF:TUPASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Supabase — Conexión directa para migraciones (puerto 5432)
DIRECT_URL="postgresql://postgres.TUREF:TUPASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con: openssl rand -base64 32"

# Usuario administrador inicial
SEED_ADMIN_EMAIL="admin@escuela.local"
SEED_ADMIN_PASSWORD="tu-password-seguro"
```

### 4. Sincronizar la base de datos

```bash
# Aplica el esquema a la base de datos
npx prisma db push

# Genera el cliente Prisma
npx prisma generate

# Carga los datos iniciales (grados, secciones, roles, usuario admin)
npx prisma db seed
```

### 5. Iniciar en modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

**Acceso al portal administrativo:** `http://localhost:3000/admin`
- Email: el que configuraste en `SEED_ADMIN_EMAIL`
- Contraseña: la que configuraste en `SEED_ADMIN_PASSWORD`

---

## Estructura del proyecto

```
├── app/
│   ├── (admin)/admin/      # Portal administrativo (todos los módulos)
│   ├── api/                # API routes (auth, importación SIGERD, reportes)
│   ├── page.tsx            # Landing page pública
│   └── layout.tsx          # Layout raíz con metadata SEO
├── components/
│   ├── admin/              # Componentes del portal (sidebar, nav, etc.)
│   └── ui/                 # Componentes base (Button, Card, Table, Input...)
├── lib/
│   ├── auth.ts             # Configuración NextAuth + RBAC callbacks
│   ├── prisma.ts           # Cliente Prisma con fix SSL/Supabase
│   ├── modules.ts          # Sistema de módulos dinámicos
│   └── sigerd-parser.ts    # Parser de Excel del MINERD
├── prisma/
│   ├── schema.prisma       # Esquema de la base de datos
│   └── seed.ts             # Datos iniciales
└── .env.production.example # Plantilla de variables para producción
```

---

## Roles y permisos

| Rol | Permisos principales |
|-----|---------------------|
| **DIRECTORA** | Acceso total — gestión del centro, personal, módulos |
| **ADMINISTRATIVO** | Alumnado, asistencia, documentos, métricas (lectura) |
| **DOCENTE** | Asistencia de sus secciones, documentos (lectura) |
| **PSICOLOGIA** | Alumnado (lectura), alertas (gestión), documentos |
| **APOYO** | Documentos (lectura) |

---

## Despliegue en producción (Vercel)

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Configura las variables de entorno en el panel de Vercel (ver `.env.production.example`)
3. Cambia `NEXTAUTH_URL` al dominio real
4. Genera un `NEXTAUTH_SECRET` nuevo: `openssl rand -base64 32`
5. Vercel hace el build y deploy automáticamente en cada push a `master`

---

## Integración SIGERD

El sistema permite importar estudiantes desde el archivo Excel **"Relación de Estudiantes por Secciones"** exportado desde [SIGERD](https://sigerd.minerd.gob.do) (Sistema de Gestión de Recursos del MINERD).

El proceso hace `upsert` por `sigerdId` — si el estudiante ya existe, actualiza sus datos; si es nuevo, lo registra y crea la matrícula en el año escolar activo.

---

## Licencia

Proyecto desarrollado para uso interno de la **Escuela Primaria Prof. Felipe Montes Gómez**.
