import type { VisualStyle } from "@/lib/types";
import { withAlpha } from "@/lib/color";
import type { SlideTheme } from "./theme";

/** Capa decorativa de fondo según el estilo visual. Todo en CSS, sin imágenes. */
export function Decorations({ style, t, number, width, height }: { style: VisualStyle; t: SlideTheme; number: number; width: number; height: number }) {
  const k = t.intensity;
  if (k <= 0.01) return null;
  const num = String(number).padStart(2, "0");
  const abs = { position: "absolute" as const, pointerEvents: "none" as const };

  switch (style) {
    case "bold":
      return (
        <>
          <div style={{ ...abs, width: 760, height: 760, borderRadius: "50%", right: -300, top: -260, background: withAlpha(t.accent, 0.16 * k) }} />
          <div style={{ ...abs, width: 420, height: 420, borderRadius: "50%", left: -220, bottom: -160, border: `${Math.round(30 * k) + 2}px solid ${withAlpha(t.accent, 0.12 * k)}` }} />
          <div style={{ ...abs, right: 50, top: 48, fontFamily: t.titleFamily, fontWeight: t.titleWeight, fontSize: 110, lineHeight: 1, color: withAlpha(t.text, 0.07 + 0.08 * k) }}>{num}</div>
        </>
      );
    case "minimal":
      return (
        <>
          <div style={{ ...abs, inset: 28, border: `1.5px solid ${withAlpha(t.text, 0.1 * k + 0.02)}`, borderRadius: 28 }} />
          <div style={{ ...abs, left: 50, top: 96, width: 14, height: 14, borderRadius: "50%", background: withAlpha(t.accent, 0.4 + 0.6 * k) }} />
        </>
      );
    case "editorial":
      return (
        <>
          <div style={{ ...abs, left: 50, right: 50, top: 120, height: 2, background: withAlpha(t.text, 0.25 * k + 0.05) }} />
          <div style={{ ...abs, left: 50, right: 50, top: 128, height: 1, background: withAlpha(t.text, 0.15 * k + 0.03) }} />
          <div style={{ ...abs, left: 50, top: 70, fontFamily: t.bodyFamily, fontSize: 22, letterSpacing: "0.3em", textTransform: "uppercase", color: withAlpha(t.text, 0.5) }}>
            N.º {num}
          </div>
          <div
            style={{
              ...abs,
              right: -30,
              bottom: -120,
              fontFamily: "'Playfair Display Variable', serif",
              fontWeight: 800,
              fontSize: 560,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: `2px ${withAlpha(t.accent, 0.25 * k)}`,
            }}
          >
            {number}
          </div>
        </>
      );
    case "tech": {
      const grid = withAlpha(t.text, 0.05 * k + 0.01);
      return (
        <>
          <div
            style={{
              ...abs,
              inset: 0,
              backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
              maskImage: "radial-gradient(ellipse at 70% 30%, black 20%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 70% 30%, black 20%, transparent 75%)",
            }}
          />
          <div style={{ ...abs, width: 900, height: 900, right: -350, top: -350, background: `radial-gradient(circle, ${withAlpha(t.accent, 0.28 * k)}, transparent 65%)` }} />
          <div style={{ ...abs, left: 50, top: 92, fontFamily: "monospace", fontSize: 22, letterSpacing: "0.12em", color: withAlpha(t.accent, 0.5 + 0.5 * k) }}>
            {"// "}
            {num}
          </div>
        </>
      );
    }
    case "gradient":
      return (
        <>
          <div style={{ ...abs, width: width * 1.1, height: width * 1.1, left: -width * 0.35, top: -width * 0.45, background: `radial-gradient(circle, ${withAlpha(t.accent, 0.42 * k)}, transparent 62%)` }} />
          <div style={{ ...abs, width: width, height: width, right: -width * 0.45, bottom: -height * 0.18, background: `radial-gradient(circle, ${withAlpha(t.accent, 0.22 * k)}, transparent 60%)`, filter: "hue-rotate(40deg)" }} />
        </>
      );
  }
}
