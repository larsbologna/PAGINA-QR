import type { ContentCategory, SlideRole, Visual, VisualKind } from "../types";
import { makeVisual } from "../visuals";
import { DEFAULT_ICONS } from "../defaultIcons";

// Versiones de una propuesta. Al volver a proponer se pasa a la siguiente: el contenido
// de cada visual se conserva, pero se muestra con otro recurso gráfico.

export const VARIATIONS = ["Clásica", "Íconos y bloques", "Diagramas"] as const;

export function variationName(version: number): string {
  return VARIATIONS[((version % VARIATIONS.length) + VARIATIONS.length) % VARIATIONS.length];
}

const I = DEFAULT_ICONS;
const CATEGORY_ICON: Record<ContentCategory, string> = {
  negocio: I["trending-up"],
  crecimiento: I.sparkles,
  motivacion: I.flame,
  proceso: I.rocket,
  habitos: I["calendar-check"],
};
const ROTATION = [I.target, I.zap, I["trending-up"], I.trophy, I.lightbulb, I.heart, I.check, I.star];

const lines = (s: string | undefined) =>
  (s ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function blocks(items: string[], layout: string, connector = "none", style = "cards") {
  return makeVisual("blocks", {
    items: JSON.stringify(items.slice(0, 6).map((title, i) => ({ icon: ROTATION[i % ROTATION.length], title, text: "" }))),
    layout,
    connector,
    style,
  });
}

function stepsOf(v: Visual): string[] {
  return [v.props.s1, v.props.s2, v.props.s3, v.props.s4].map((x) => (x ?? "").trim()).filter(Boolean);
}

/**
 * Visual de la versión N a partir del visual base (versión 0). Lo que no tiene una
 * alternativa clara (mockups de marcas, fotos, QR, botón final) se mantiene igual.
 */
export function varyVisual(base: Visual, version: number, ctx: { category: ContentCategory; role: SlideRole; tipIndex: number }): Visual {
  const v = ((version % VARIATIONS.length) + VARIATIONS.length) % VARIATIONS.length;
  if (v === 0) return base;
  const p = base.props;
  const kind: VisualKind = base.kind;

  if (kind === "steps") {
    const s = stepsOf(base);
    return v === 1 ? blocks(s, "row", "arrows") : makeVisual("timeline", { items: s.map((x, i) => `Paso ${i + 1}: ${x}`).join("\n") });
  }
  if (kind === "comparison") {
    if (v === 1) return makeVisual("do-dont", { doTitle: p.rightTitle, do: p.right, dontTitle: p.leftTitle, dont: p.left });
    const l = lines(p.left);
    const r = lines(p.right);
    const rows = [`| ${p.leftTitle} | ${p.rightTitle}`, ...l.map((x, i) => `${i + 1} | ${x} | ${r[i] ?? ""}`)];
    return makeVisual("table", { rows: rows.join("\n") });
  }
  if (kind === "checklist") {
    const items = lines(p.items);
    return v === 1 ? blocks(items, "column", "numbers", "outline") : makeVisual("sticky-notes", { items: items.join("\n") });
  }
  if (kind === "quote") {
    return v === 1 ? makeVisual("icon-hero", { icon: CATEGORY_ICON[ctx.category], caption: "", shape: "circle" }) : makeVisual("none");
  }
  if (kind === "none") {
    if (ctx.role === "hook" || ctx.role === "proof") return v === 1 ? makeVisual("icon-hero", { icon: CATEGORY_ICON[ctx.category], caption: "", shape: "circle" }) : base;
    if (ctx.role === "tip" && v === 2) return makeVisual("icon-hero", { icon: ROTATION[ctx.tipIndex % ROTATION.length], caption: "", shape: "plain" });
    return base;
  }
  if (kind === "stats") {
    return v === 1
      ? makeVisual("progress", {
          items: (p.labels ?? "")
            .split(",")
            .map((l, i) => `${l.trim()}: ${Math.min(100, Number((p.values ?? "").split(",")[i]) || 0)}`)
            .join("\n"),
          note: p.note,
        })
      : makeVisual("line-chart", { title: p.title, labels: p.labels, values: p.values, note: p.note });
  }
  if (kind === "phone" || kind === "review" || kind === "chat") {
    // Mockups genéricos: en las versiones nuevas se alternan entre sí para variar.
    const order: VisualKind[] = ["phone", "review", "notifications", "chat"];
    const next = order[(order.indexOf(kind) + v) % order.length];
    return next === "notifications" ? makeVisual("notifications", { app: p.app ?? p.name ?? "Tu cuenta" }) : makeVisual(next);
  }
  return base;
}
