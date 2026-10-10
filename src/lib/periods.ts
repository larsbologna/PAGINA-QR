export const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 días", days: 7 },
  { value: "30", label: "Últimos 30 días", days: 30 },
  { value: "90", label: "Últimos 90 días", days: 90 },
  { value: "365", label: "Últimos 12 meses", days: 365 },
] as const;

export type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

export function parsePeriod(raw: string | string[] | undefined, fallback: PeriodValue = "30"): {
  value: PeriodValue;
  days: number;
  label: string;
} {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const found = PERIOD_OPTIONS.find((p) => p.value === v) ?? PERIOD_OPTIONS.find((p) => p.value === fallback)!;
  return { value: found.value, days: found.days, label: found.label };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export interface Range {
  from: Date;
  to: Date;
}

/** Período actual [ahora - N días, ahora) y el período anterior de igual longitud. */
export function periodRanges(days: number, now: Date = new Date()): { current: Range; previous: Range } {
  const to = new Date(now.getTime());
  const from = new Date(now.getTime() - days * DAY_MS);
  const prevFrom = new Date(from.getTime() - days * DAY_MS);
  return { current: { from, to }, previous: { from: prevFrom, to: from } };
}
