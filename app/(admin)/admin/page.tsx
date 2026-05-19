import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/lib/authz";

export default async function AdminHome() {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen rápido del centro y accesos a módulos."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Usuario" value={session?.user?.email ?? "—"} hint="Sesión activa" />
        <KpiCard
          label="Roles"
          value={(session?.user?.roles?.length ?? 0).toString()}
          hint={(session?.user?.roles ?? []).join(", ") || "—"}
        />
        <KpiCard
          label="Permisos"
          value={(session?.user?.permissions?.length ?? 0).toString()}
          hint="RBAC aplicado en servidor"
        />
      </div>

      <div className="rounded-2xl border border-black/10 bg-black/[.02] p-5 text-sm text-muted-foreground">
        Próximo: módulos de Personal, Alumnado, Asistencia (Semáforo), Documentos, APMAE y
        Métricas.
      </div>
    </div>
  );
}

