import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AverageChart, CountChart } from "@/components/charts/trend-charts";
import type { SeriesPoint } from "@/server/services/stats";
import { formatNumber } from "@/lib/format";
import { MIN_FEEDBACK_FOR_INSIGHTS } from "@/lib/insights";

const UNIT_LABEL = { day: "día", week: "semana", month: "mes" } as const;

export function TrendSection({ series, unit, total }: { series: SeriesPoint[]; unit: keyof typeof UNIT_LABEL; total: number }) {
  const unitLabel = UNIT_LABEL[unit];
  if (total < 2) {
    return (
      <Card>
        <CardHeader title="Evolución en el tiempo" />
        <CardBody>
          <p className="py-8 text-center text-sm text-muted">
            Todavía no hay suficientes opiniones en este período para mostrar una evolución.
          </p>
        </CardBody>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title={`Opiniones por ${unitLabel}`} description="Cantidad recibida en el período" />
        <CardBody>
          <CountChart data={series} unitLabel={unitLabel} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title={`Promedio interno por ${unitLabel}`}
          description={total < MIN_FEEDBACK_FOR_INSIGHTS ? "Pocas opiniones: el promedio puede variar mucho." : "Escala de 1 a 5"}
        />
        <CardBody>
          <AverageChart data={series} unitLabel={unitLabel} />
        </CardBody>
      </Card>
      <details className="rounded-xl border border-line bg-white px-5 py-3 text-sm lg:col-span-2">
        <summary className="cursor-pointer font-medium text-slate-700">Ver datos en tabla</summary>
        <div className="mt-3 max-h-72 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 font-medium">Período</th>
                <th className="py-1 text-right font-medium">Opiniones</th>
                <th className="py-1 text-right font-medium">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {series.map((p) => (
                <tr key={p.key}>
                  <td className="py-1">{p.label}</td>
                  <td className="py-1 text-right">{formatNumber(p.count)}</td>
                  <td className="py-1 text-right">{p.average === null ? "—" : formatNumber(p.average, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
