/**
 * Generación de CSV compatible con Excel en configuración regional argentina:
 * separador ";" y BOM UTF-8. Las celdas que empiezan con =, +, -, @ se prefijan
 * con un apóstrofo para evitar inyección de fórmulas.
 */
export const CSV_SEPARATOR = ";";

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[";\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(escapeCsvCell).join(CSV_SEPARATOR));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
