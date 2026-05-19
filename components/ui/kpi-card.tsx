import { cn } from "@/components/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("min-h-[104px]", className)}>
      <CardContent>
        <div className="text-sm font-medium text-brand-blue">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {hint ? <div className="mt-2 text-sm text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

