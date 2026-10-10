const DEFAULT_TZ = "America/Argentina/Buenos_Aires";

export function formatDateTime(d: Date | string, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function formatDate(d: Date | string, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(d),
  );
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function formatPercent(n: number): string {
  return `${formatNumber(n, 0)}%`;
}

/** Fecha local YYYY-MM-DD en la zona horaria indicada. */
export function localDayKey(d: Date, timeZone = DEFAULT_TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts;
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return `${formatNumber(n)} ${n === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}
