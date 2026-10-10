"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART } from "./tokens";
import { formatNumber } from "@/lib/format";

export interface TrendPoint {
  label: string;
  count: number;
  average: number | null;
}

function TooltipBox({ title, value, name }: { title: string; value: string; name: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-0.5 flex items-center gap-2">
        <span className="inline-block h-0.5 w-3 rounded" style={{ background: CHART.series1 }} aria-hidden />
        <strong className="text-ink">{value}</strong>
        <span className="text-muted">{name}</span>
      </p>
    </div>
  );
}

const axisProps = {
  tick: { fill: CHART.muted, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
} as const;

/** Dos gráficos separados (nunca doble eje): cantidad de opiniones y promedio interno. */
export function CountChart({ data, unitLabel }: { data: TrendPoint[]; unitLabel: string }) {
  return (
    <div className="h-56 w-full" role="img" aria-label={`Cantidad de opiniones por ${unitLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
          <YAxis allowDecimals={false} {...axisProps} axisLine={false} width={40} />
          <Tooltip
            cursor={{ fill: "rgba(15,23,42,0.04)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipBox title={String(label)} value={formatNumber(Number(payload[0]!.value))} name="opiniones" />
              ) : null
            }
          />
          <Bar dataKey="count" fill={CHART.series1} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AverageChart({ data, unitLabel }: { data: TrendPoint[]; unitLabel: string }) {
  return (
    <div className="h-56 w-full" role="img" aria-label={`Promedio interno por ${unitLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} {...axisProps} axisLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = payload[0]!.value;
              return <TooltipBox title={String(label)} value={v == null ? "sin datos" : formatNumber(Number(v), 1)} name="promedio" />;
            }}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke={CHART.series1}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART.series1, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
