"use client";
import { decodeIcon } from "@/lib/icons";

const decoded = new Map<string, ReturnType<typeof decodeIcon>>();

function decodeCached(value: string) {
  let d = decoded.get(value);
  if (d === undefined) {
    d = decodeIcon(value);
    decoded.set(value, d);
  }
  return d;
}

/** Dibuja un ícono guardado (o un emoji) del tamaño y color indicados. */
export function IconGlyph({ value, size, color, strokeWidth }: { value: string | undefined; size: number; color: string; strokeWidth?: number }) {
  const icon = value ? decodeCached(value) : null;
  if (!icon) return null;
  if ("emoji" in icon) {
    return <span style={{ fontSize: size * 0.9, lineHeight: 1, display: "inline-block", width: size, textAlign: "center" }}>{icon.emoji}</span>;
  }
  const body = strokeWidth ? icon.b.replace(/stroke-width="[\d.]+"/g, `stroke-width="${strokeWidth}"`) : icon.b;
  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.v}
      style={{ color, display: "block", flexShrink: 0 }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
