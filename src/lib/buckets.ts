import { localDayKey } from "./format";

export type BucketUnit = "day" | "week" | "month";

export function bucketUnitForDays(days: number): BucketUnit {
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

/** Convierte una fecha local YYYY-MM-DD a la clave del bucket (lunes de la semana o día 1 del mes). */
export function bucketKeyForDay(dayKey: string, unit: BucketUnit): string {
  if (unit === "day") return dayKey;
  if (unit === "month") return `${dayKey.slice(0, 7)}-01`;
  const d = new Date(`${dayKey}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // lunes = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Lista ordenada de buckets que cubren [from, to] en la zona horaria del negocio. */
export function bucketKeys(from: Date, to: Date, unit: BucketUnit, timeZone: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const step = 6 * 3600 * 1000; // paso de 6 h para no saltear días por cambios de horario
  for (let t = from.getTime(); t <= to.getTime(); t += step) {
    const k = bucketKeyForDay(localDayKey(new Date(t), timeZone), unit);
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
  }
  const last = bucketKeyForDay(localDayKey(to, timeZone), unit);
  if (!seen.has(last)) keys.push(last);
  return keys;
}

export function bucketLabel(key: string, unit: BucketUnit): string {
  const [y, m, d] = key.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  if (unit === "month") return `${months[Number(m) - 1]} ${y!.slice(2)}`;
  if (unit === "week") return `sem. ${d}/${m}`;
  return `${d}/${m}`;
}
