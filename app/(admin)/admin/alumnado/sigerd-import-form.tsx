"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ImportResult = {
  success: boolean;
  summary?: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
  };
  errors?: string[];
  error?: string;
  parseErrors?: string[];
};

export function SigerdImportForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file") as File | null;
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import/sigerd", {
        method: "POST",
        body: formData,
      });
      const data: ImportResult = await res.json();
      setResult(data);

      if (data.success) {
        // Refresh the page data to show new students
        router.refresh();
      }
    } catch {
      setResult({ success: false, error: "Error de conexión. Inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Archivo Excel (.xlsx)</label>
            <input
              ref={fileRef}
              name="file"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-blue-light"
              required
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFileName(f?.name ?? null);
                setResult(null);
              }}
            />
          </div>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {loading ? "Importando..." : "Importar"}
          </Button>
        </div>
        <p className="text-sm text-zinc-500">
          Formato: &quot;Relación de Estudiantes por Secciones&quot; descargado
          desde SIGERD. Los estudiantes existentes se actualizarán por su ID de
          SIGERD.
        </p>
      </form>

      {/* ── Import result feedback ──────────────────────── */}
      {result && result.success && result.summary && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-emerald-900">
                Importación completada
              </p>
              <p className="text-sm text-emerald-700">
                {result.summary.total} estudiantes procesados:{" "}
                <strong>{result.summary.created}</strong> nuevos,{" "}
                <strong>{result.summary.updated}</strong> actualizados
                {result.summary.skipped > 0 && (
                  <>, <strong>{result.summary.skipped}</strong> omitidos</>
                )}
              </p>
              {result.errors && result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-emerald-600 hover:text-emerald-800">
                    Ver {result.errors.length} advertencia
                    {result.errors.length !== 1 ? "s" : ""}
                  </summary>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-emerald-700">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900">
                Error en la importación
              </p>
              <p className="text-sm text-red-700">
                {result.error ?? "Ocurrió un error desconocido."}
              </p>
              {result.parseErrors && result.parseErrors.length > 0 && (
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-red-700">
                  {result.parseErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
