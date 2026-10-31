"use client";
// Biblioteca ampliada de visuales: datos, diagramas, listas, interfaces e imágenes.
// Todos se dibujan con los colores del slide y se adaptan al espacio disponible.
import { mix, withAlpha } from "@/lib/color";
import { parseItems } from "@/lib/visuals";
import { sanitizeSvg } from "@/lib/sanitize";
import type { SlideTheme } from "@/components/slide/theme";
import { FitBox, IllustrationTag, cardStyle, depth, lines, list } from "./base";
import { IconGlyph } from "./IconGlyph";
import type { VisualProps } from "./general";

/** "Nombre: 40" por línea → [{ label, value }]. */
function pairs(s: string | undefined): { label: string; value: number; raw: string }[] {
  return lines(s).map((l) => {
    const i = l.lastIndexOf(":");
    const label = i > 0 ? l.slice(0, i).trim() : l;
    const raw = i > 0 ? l.slice(i + 1).trim() : "";
    return { label, raw, value: Number(raw.replace("%", "").replace(",", ".")) || 0 };
  });
}

const font = (t: SlideTheme) => ({ fontFamily: t.bodyFamily, color: t.text });

/** Paleta derivada del acento para series de datos. */
function series(t: SlideTheme, n: number): string[] {
  return Array.from({ length: n }, (_, i) => (i === 0 ? t.accent : mix(t.accent, t.dark ? "#ffffff" : t.text, Math.min(0.75, 0.22 * i + 0.12))));
}

// ——— Bloques (constructor) ———
export function BlocksVisual({ p, t }: VisualProps) {
  const items = parseItems(p.items);
  const n = Math.max(1, items.length);
  const style = p.style || "cards";
  const layout = p.layout || "grid2";
  const connector = p.connector || "none";

  const card = (extra: React.CSSProperties = {}): React.CSSProperties =>
    style === "cards"
      ? cardStyle(t, { borderRadius: 28, ...extra })
      : style === "outline"
        ? { border: `2.5px solid ${withAlpha(t.text, 0.22)}`, borderRadius: 28, ...extra }
        : { ...extra };

  const badge = (i: number, size: number) => (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: style === "circles" ? 999 : size * 0.3,
        display: "grid",
        placeItems: "center",
        background: style === "plain" ? "transparent" : withAlpha(t.accent, style === "circles" ? 1 : 0.16),
        position: "relative",
      }}
    >
      <IconGlyph value={items[i]?.icon} size={size * (style === "plain" ? 0.95 : 0.55)} color={style === "circles" ? t.accentInk : t.accent} />
      {connector === "numbers" && (
        <span
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 40,
            height: 40,
            borderRadius: 99,
            background: t.text,
            color: t.bg,
            fontSize: 22,
            fontWeight: 800,
            display: "grid",
            placeItems: "center",
          }}
        >
          {i + 1}
        </span>
      )}
    </div>
  );

  const Arrow = ({ vertical = false }: { vertical?: boolean }) =>
    connector === "arrows" ? (
      <div style={{ display: "grid", placeItems: "center", color: t.accent, fontSize: 46, fontWeight: 800, transform: vertical ? "rotate(90deg)" : undefined, flexShrink: 0 }}>→</div>
    ) : null;

  if (layout === "row") {
    const W = 980;
    return (
      <FitBox w={W} h={420}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "stretch", gap: 14, ...font(t) }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "contents" }}>
              <div style={{ ...card(), flex: 1, padding: "34px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
                {badge(i, n > 4 ? 90 : 110)}
                <div style={{ fontSize: n > 4 ? 28 : 34, fontWeight: 700, lineHeight: 1.15 }}>{it.title}</div>
                {it.text && <div style={{ fontSize: n > 4 ? 21 : 25, lineHeight: 1.3, color: withAlpha(t.text, 0.7) }}>{it.text}</div>}
              </div>
              {i < items.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </FitBox>
    );
  }

  if (layout === "column" || layout === "hero") {
    const rows = layout === "hero" ? items.slice(1) : items;
    const heroH = layout === "hero" ? 260 : 0;
    const H = heroH + rows.length * 150 + 20;
    return (
      <FitBox w={940} h={H}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 18, ...font(t) }}>
          {layout === "hero" && items[0] && (
            <div style={{ ...card({ background: style === "cards" ? withAlpha(t.accent, 0.14) : undefined }), height: 240, padding: "0 44px", display: "flex", alignItems: "center", gap: 36 }}>
              {badge(0, 160)}
              <div>
                <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05 }}>{items[0].title}</div>
                {items[0].text && <div style={{ marginTop: 10, fontSize: 30, color: withAlpha(t.text, 0.75) }}>{items[0].text}</div>}
              </div>
            </div>
          )}
          {rows.map((it, j) => {
            const i = layout === "hero" ? j + 1 : j;
            return (
              <div key={i} style={{ display: "contents" }}>
                <div style={{ ...card(), height: 132, padding: "0 34px", display: "flex", alignItems: "center", gap: 28 }}>
                  {badge(i, 92)}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{it.title}</div>
                    {it.text && <div style={{ marginTop: 6, fontSize: 26, color: withAlpha(t.text, 0.7) }}>{it.text}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </FitBox>
    );
  }

  const cols = layout === "grid3" ? 3 : 2;
  const rowsN = Math.ceil(n / cols);
  const W = 980;
  const cellH = cols === 3 ? 300 : 280;
  return (
    <FitBox w={W} h={rowsN * cellH + (rowsN - 1) * 22}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: cellH, gap: 22, ...font(t) }}>
        {items.map((it, i) => (
          <div key={i} style={{ ...card(), padding: cols === 3 ? "30px 26px" : "34px 34px", display: "flex", flexDirection: "column", gap: 16 }}>
            {badge(i, cols === 3 ? 84 : 96)}
            <div style={{ fontSize: cols === 3 ? 30 : 36, fontWeight: 700, lineHeight: 1.12 }}>{it.title}</div>
            {it.text && <div style={{ fontSize: cols === 3 ? 22 : 26, lineHeight: 1.3, color: withAlpha(t.text, 0.7) }}>{it.text}</div>}
          </div>
        ))}
      </div>
    </FitBox>
  );
}

// ——— Ícono grande ———
export function IconHeroVisual({ p, t }: VisualProps) {
  const shape = p.shape || "circle";
  return (
    <FitBox w={700} h={p.caption ? 620 : 520}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, ...font(t) }}>
        <div style={{ position: "absolute", width: 480, height: 480, top: 20, borderRadius: 999, background: withAlpha(t.accent, 0.28), filter: "blur(80px)" }} />
        <div
          style={{
            position: "relative",
            width: 480,
            height: 480,
            borderRadius: shape === "circle" ? 999 : shape === "square" ? 110 : 0,
            background: shape === "plain" ? "transparent" : `linear-gradient(145deg, ${mix(t.accent, "#ffffff", 0.2)}, ${t.accent})`,
            display: "grid",
            placeItems: "center",
            boxShadow: shape === "plain" ? "none" : `0 40px 90px -30px ${withAlpha(t.accent, 0.8)}`,
          }}
        >
          <IconGlyph value={p.icon} size={shape === "plain" ? 440 : 260} color={shape === "plain" ? t.accent : t.accentInk} strokeWidth={shape === "plain" ? 1.4 : 1.6} />
        </div>
        {p.caption && <div style={{ position: "relative", fontSize: 40, fontWeight: 700, textAlign: "center" }}>{p.caption}</div>}
      </div>
    </FitBox>
  );
}

// ——— Dibujo propio (SVG generado por IA o importado) ———
export function SvgVisual({ p, t }: VisualProps) {
  const clean = p.svg ? sanitizeSvg(p.svg) : "";
  if (!clean) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          border: `3px dashed ${withAlpha(t.text, 0.2)}`,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: 40,
          color: withAlpha(t.text, 0.5),
          fontFamily: t.bodyFamily,
          fontSize: 30,
        }}
      >
        Creá el dibujo con IA o pegá un SVG desde el panel del slide
      </div>
    );
  }
  // El SVG ya saneado se escala solo con su viewBox.
  const sized = clean.replace(/^<svg/i, '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"');
  return <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: sized }} />;
}

// ——— Número destacado ———
export function BigNumberVisual({ p, t }: VisualProps) {
  return (
    <FitBox w={940} h={520}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", ...font(t) }}>
        <div
          style={{
            fontFamily: t.titleFamily,
            fontWeight: t.titleWeight,
            fontSize: p.value.length > 6 ? 190 : 260,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: t.accent,
            textShadow: `0 20px 80px ${withAlpha(t.accent, 0.45)}`,
          }}
        >
          {p.value}
        </div>
        <div style={{ marginTop: 28, maxWidth: 820, fontSize: 42, lineHeight: 1.2, fontWeight: 600 }}>{p.label}</div>
        {p.note && <div style={{ marginTop: 18, fontSize: 22, color: withAlpha(t.text, 0.5) }}>{p.note}</div>}
      </div>
    </FitBox>
  );
}

// ——— Barras de progreso ———
export function ProgressVisual({ p, t }: VisualProps) {
  const rows = pairs(p.items).slice(0, 6);
  const H = rows.length * 120 + (p.note ? 60 : 0) + 20;
  return (
    <FitBox w={940} h={H}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 34, ...font(t) }}>
        {rows.map((r, i) => {
          const pct = Math.max(0, Math.min(100, r.value));
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 600, marginBottom: 12 }}>
                <span>{r.label}</span>
                <span style={{ color: t.accent, fontWeight: 800 }}>{pct}%</span>
              </div>
              <div style={{ height: 34, borderRadius: 99, background: withAlpha(t.text, 0.1), overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${mix(t.accent, t.bg, 0.25)}, ${t.accent})` }} />
              </div>
            </div>
          );
        })}
        {p.note && <div style={{ fontSize: 22, color: withAlpha(t.text, 0.5) }}>{p.note}</div>}
      </div>
    </FitBox>
  );
}

// ——— Torta ———
export function DonutVisual({ p, t }: VisualProps) {
  const parts = pairs(p.items).filter((x) => x.value > 0).slice(0, 6);
  const total = parts.reduce((a, b) => a + b.value, 0) || 1;
  const colors = series(t, parts.length);
  const R = 200;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <FitBox w={980} h={520}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 60, ...font(t) }}>
        <div style={{ position: "relative", width: 500, height: 500, flexShrink: 0 }}>
          <svg width="500" height="500" viewBox="0 0 500 500" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="250" cy="250" r={R} fill="none" stroke={withAlpha(t.text, 0.08)} strokeWidth="70" />
            {parts.map((x, i) => {
              const len = (x.value / total) * C;
              const el = (
                <circle key={i} cx="250" cy="250" r={R} fill="none" stroke={colors[i]} strokeWidth="70" strokeDasharray={`${Math.max(0, len - 6)} ${C}`} strokeDashoffset={-acc} />
              );
              acc += len;
              return el;
            })}
          </svg>
          {p.center && (
            <div style={{ position: "absolute", inset: 110, display: "grid", placeItems: "center", textAlign: "center", fontSize: 34, fontWeight: 700, lineHeight: 1.15 }}>{p.center}</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {parts.map((x, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 32 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: colors[i], flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{x.label}</span>
              <span style={{ color: withAlpha(t.text, 0.55) }}>{Math.round((x.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </FitBox>
  );
}

// ——— Líneas ———
export function LineChartVisual({ p, t }: VisualProps) {
  const labels = list(p.labels);
  const values = list(p.values).map((v) => Number(v.replace(",", ".")) || 0);
  const n = Math.max(2, Math.min(12, values.length));
  const W = 940;
  const H = 600;
  const pad = { l: 60, r: 40, t: 110, b: 80 };
  const max = Math.max(1, ...values.slice(0, n));
  const min = Math.min(0, ...values.slice(0, n));
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (n - 1);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);
  const pts = values.slice(0, n).map((v, i) => `${x(i)},${y(v)}`);
  const area = `M${x(0)},${H - pad.b} L${pts.join(" L")} L${x(n - 1)},${H - pad.b} Z`;
  return (
    <FitBox w={W} h={H}>
      <div style={{ ...cardStyle(t), position: "absolute", inset: 0, ...font(t) }}>
        <div style={{ position: "absolute", left: 40, top: 32, fontSize: 34, fontWeight: 700 }}>{p.title}</div>
        {p.note && <div style={{ position: "absolute", right: 40, top: 42, fontSize: 20, color: withAlpha(t.text, 0.5) }}>{p.note}</div>}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={t.accent} stopOpacity="0.35" />
              <stop offset="1" stopColor={t.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((g) => (
            <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + g * (H - pad.t - pad.b)} y2={pad.t + g * (H - pad.t - pad.b)} stroke={withAlpha(t.text, 0.1)} strokeDasharray="8 8" strokeWidth="2" />
          ))}
          <path d={area} fill="url(#lc-area)" />
          <polyline points={pts.join(" ")} fill="none" stroke={t.accent} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
          {values.slice(0, n).map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={i === n - 1 ? 14 : 8} fill={i === n - 1 ? t.accent : t.surface} stroke={t.accent} strokeWidth="5" />
          ))}
          {labels.slice(0, n).map((l, i) => (
            <text key={i} x={x(i)} y={H - 34} textAnchor="middle" fontSize="22" fill={withAlpha(t.text, 0.6)} fontFamily={t.bodyFamily}>
              {l}
            </text>
          ))}
        </svg>
      </div>
    </FitBox>
  );
}

// ——— Seguimiento de hábito ———
export function HabitTrackerVisual({ p, t }: VisualProps) {
  const total = Math.max(7, Math.min(35, Number(p.total) || 28));
  const done = Math.max(0, Math.min(total, Number(p.done) || 0));
  const rows = Math.ceil(total / 7);
  return (
    <FitBox w={900} h={170 + rows * 110}>
      <div style={{ ...cardStyle(t), position: "absolute", inset: 0, padding: "36px 40px", ...font(t) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{p.habit}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: t.accent }}>
            {done}/{total}
          </div>
        </div>
        <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 14 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                height: 96,
                borderRadius: 20,
                display: "grid",
                placeItems: "center",
                background: i < done ? t.accent : withAlpha(t.text, 0.07),
                color: i < done ? t.accentInk : withAlpha(t.text, 0.35),
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {i < done ? "✓" : i + 1}
            </div>
          ))}
        </div>
      </div>
    </FitBox>
  );
}

// ——— Línea de tiempo ———
export function TimelineVisual({ p, t }: VisualProps) {
  const rows = pairs(p.items).slice(0, 6);
  const H = rows.length * 150;
  return (
    <FitBox w={940} h={Math.max(300, H)}>
      <div style={{ position: "absolute", left: 120, top: 40, bottom: 40, width: 6, borderRadius: 6, background: `linear-gradient(${t.accent}, ${withAlpha(t.accent, 0.15)})` }} />
      {rows.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * 150 + 10, height: 130, display: "flex", alignItems: "center", ...font(t) }}>
          <div style={{ width: 100, textAlign: "right", fontSize: 26, fontWeight: 800, color: t.accent, paddingRight: 8 }}>{r.label}</div>
          <div style={{ width: 46, display: "grid", placeItems: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: 99, background: i === rows.length - 1 ? t.accent : t.bg, border: `6px solid ${t.accent}` }} />
          </div>
          <div style={{ ...cardStyle(t, { borderRadius: 22 }), flex: 1, marginLeft: 20, padding: "26px 32px", fontSize: 32, fontWeight: 600 }}>{r.raw || r.label}</div>
        </div>
      ))}
    </FitBox>
  );
}

// ——— Pirámide ———
export function PyramidVisual({ p, t }: VisualProps) {
  const levels = lines(p.items).slice(0, 6);
  const n = Math.max(1, levels.length);
  const W = 940;
  const lh = 130;
  const H = n * lh;
  const colors = series(t, n);
  return (
    <FitBox w={W} h={H}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {levels.map((_, i) => {
          const top = i * lh + 4;
          const bot = top + lh - 10;
          const half = (y: number) => ((y / H) * W) / 2;
          const c = W / 2;
          return <polygon key={i} points={`${c - half(top)},${top} ${c + half(top)},${top} ${c + half(bot)},${bot} ${c - half(bot)},${bot}`} fill={colors[i]} />;
        })}
      </svg>
      {levels.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: i * lh + (i === 0 ? 50 : 0),
            height: i === 0 ? lh - 50 : lh - 6,
            display: "grid",
            placeItems: "center",
            fontFamily: t.bodyFamily,
            fontSize: i === 0 ? 26 : 32,
            fontWeight: 800,
            color: i === 0 ? t.accentInk : t.dark ? "#0a0a0a" : t.bg,
          }}
        >
          {l}
        </div>
      ))}
    </FitBox>
  );
}

// ——— Embudo ———
export function FunnelVisual({ p, t }: VisualProps) {
  const stages = lines(p.items).slice(0, 6);
  const n = Math.max(1, stages.length);
  const colors = series(t, n).reverse();
  return (
    <FitBox w={940} h={n * 120}>
      {stages.map((s, i) => {
        const w = 940 - (i * 940 * 0.5) / Math.max(1, n - 1 || 1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: i * 120,
              left: (940 - w) / 2,
              width: w,
              height: 104,
              borderRadius: 26,
              background: colors[i],
              display: "grid",
              placeItems: "center",
              fontFamily: t.bodyFamily,
              fontSize: 34,
              fontWeight: 800,
              color: i === n - 1 ? t.accentInk : t.dark ? "#0a0a0a" : t.bg,
            }}
          >
            {s}
          </div>
        );
      })}
    </FitBox>
  );
}

// ——— Matriz 2x2 ———
export function MatrixVisual({ p, t }: VisualProps) {
  const cell = (text: string, hot: boolean) => (
    <div
      style={{
        ...cardStyle(t, { borderRadius: 26 }),
        background: hot ? t.accent : t.surface,
        color: hot ? t.accentInk : t.text,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: 24,
        fontSize: 36,
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
  return (
    <FitBox w={940} h={700}>
      <div style={{ position: "absolute", left: 70, right: 0, top: 0, bottom: 70, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 18, fontFamily: t.bodyFamily }}>
        {cell(p.tl, false)}
        {cell(p.tr, true)}
        {cell(p.bl, false)}
        {cell(p.br, false)}
      </div>
      <div style={{ position: "absolute", left: 70, right: 0, bottom: 10, textAlign: "center", fontSize: 26, fontWeight: 700, color: withAlpha(t.text, 0.6), fontFamily: t.bodyFamily }}>{p.xLabel}</div>
      <div
        style={{
          position: "absolute",
          left: -280,
          top: 290,
          width: 630,
          textAlign: "center",
          transform: "rotate(-90deg)",
          fontSize: 26,
          fontWeight: 700,
          color: withAlpha(t.text, 0.6),
          fontFamily: t.bodyFamily,
        }}
      >
        {p.yLabel}
      </div>
    </FitBox>
  );
}

// ——— Ciclo ———
export function CycleVisual({ p, t }: VisualProps) {
  const steps = lines(p.items).slice(0, 6);
  const n = Math.max(3, steps.length);
  const S = 760;
  const c = S / 2;
  const R = 270;
  return (
    <FitBox w={S} h={S}>
      <svg width={S} height={S} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <marker id="cy-arrow" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={t.accent} />
          </marker>
        </defs>
        {steps.map((_, i) => {
          const a1 = (i / n) * 2 * Math.PI - Math.PI / 2 + 0.38;
          const a2 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2 - 0.38;
          return (
            <path
              key={i}
              d={`M${c + R * Math.cos(a1)},${c + R * Math.sin(a1)} A${R},${R} 0 0 1 ${c + R * Math.cos(a2)},${c + R * Math.sin(a2)}`}
              fill="none"
              stroke={t.accent}
              strokeWidth="7"
              markerEnd="url(#cy-arrow)"
            />
          );
        })}
      </svg>
      {steps.map((s, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c + R * Math.cos(a) - 110,
              top: c + R * Math.sin(a) - 60,
              width: 220,
              height: 120,
              borderRadius: 28,
              background: i === 0 ? t.accent : t.surface,
              color: i === 0 ? t.accentInk : t.text,
              border: `2px solid ${i === 0 ? t.accent : t.line}`,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: 12,
              fontFamily: t.bodyFamily,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {s}
          </div>
        );
      })}
      {p.center && (
        <div style={{ position: "absolute", left: c - 130, top: c - 60, width: 260, height: 120, display: "grid", placeItems: "center", textAlign: "center", fontFamily: t.bodyFamily, fontSize: 28, fontWeight: 700, color: withAlpha(t.text, 0.75) }}>
          {p.center}
        </div>
      )}
    </FitBox>
  );
}

// ——— Venn ———
export function VennVisual({ p, t }: VisualProps) {
  return (
    <FitBox w={940} h={600}>
      <svg width="940" height="600" style={{ position: "absolute", inset: 0 }}>
        <circle cx="330" cy="300" r="270" fill={withAlpha(t.accent, 0.22)} stroke={t.accent} strokeWidth="4" />
        <circle cx="610" cy="300" r="270" fill={withAlpha(t.text, 0.1)} stroke={withAlpha(t.text, 0.5)} strokeWidth="4" />
      </svg>
      <div style={{ position: "absolute", left: 90, top: 250, width: 230, textAlign: "center", fontFamily: t.bodyFamily, fontSize: 32, fontWeight: 700, color: t.text }}>{p.a}</div>
      <div style={{ position: "absolute", left: 620, top: 250, width: 230, textAlign: "center", fontFamily: t.bodyFamily, fontSize: 32, fontWeight: 700, color: t.text }}>{p.b}</div>
      <div
        style={{
          position: "absolute",
          left: 370,
          top: 245,
          width: 200,
          padding: "16px 10px",
          borderRadius: 20,
          background: t.accent,
          color: t.accentInk,
          textAlign: "center",
          fontFamily: t.bodyFamily,
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {p.center}
      </div>
    </FitBox>
  );
}

// ——— Sí / No ———
export function DoDontVisual({ p, t }: VisualProps) {
  const col = (title: string, items: string[], good: boolean) => (
    <div style={{ ...cardStyle(t, { borderRadius: 30 }), flex: 1, padding: "34px 32px", borderTop: `10px solid ${good ? "#22c55e" : "#ef4444"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 36, fontWeight: 800 }}>
        <span style={{ width: 52, height: 52, borderRadius: 99, display: "grid", placeItems: "center", background: good ? "#22c55e" : "#ef4444", color: "#fff", fontSize: 30 }}>
          {good ? "✓" : "✕"}
        </span>
        {title}
      </div>
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: 30, lineHeight: 1.25, color: withAlpha(t.text, 0.85) }}>
            {it}
          </div>
        ))}
      </div>
    </div>
  );
  const rows = Math.max(lines(p.do).length, lines(p.dont).length);
  return (
    <FitBox w={980} h={180 + rows * 70}>
      <div style={{ position: "absolute", inset: 0, display: "flex", gap: 26, ...font(t) }}>
        {col(p.doTitle, lines(p.do), true)}
        {col(p.dontTitle, lines(p.dont), false)}
      </div>
    </FitBox>
  );
}

// ——— Mito vs. realidad ———
export function MythFactVisual({ p, t }: VisualProps) {
  const block = (tag: string, text: string, fact: boolean) => (
    <div
      style={{
        ...cardStyle(t, { borderRadius: 30 }),
        padding: "34px 38px",
        background: fact ? withAlpha(t.accent, 0.12) : t.surface,
        border: `2.5px solid ${fact ? t.accent : t.line}`,
      }}
    >
      <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 99, fontSize: 22, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", background: fact ? t.accent : withAlpha(t.text, 0.12), color: fact ? t.accentInk : withAlpha(t.text, 0.7) }}>
        {tag}
      </div>
      <div style={{ marginTop: 18, fontSize: 38, lineHeight: 1.25, fontWeight: 700, textDecoration: fact ? "none" : "line-through", textDecorationColor: withAlpha(t.text, 0.4), color: fact ? t.text : withAlpha(t.text, 0.7) }}>
        {text}
      </div>
    </div>
  );
  return (
    <FitBox w={940} h={560}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, ...font(t) }}>
        {block("Mito", p.myth, false)}
        {block("Realidad", p.fact, true)}
      </div>
    </FitBox>
  );
}

// ——— Tabla ———
export function TableVisual({ p, t }: VisualProps) {
  const rows = lines(p.rows).map((r) => r.split("|").map((c) => c.trim()));
  const cols = Math.max(1, ...rows.map((r) => r.length));
  return (
    <FitBox w={960} h={rows.length * 104 + 10}>
      <div style={{ ...cardStyle(t, { borderRadius: 28, overflow: "hidden" }), position: "absolute", inset: 0, ...font(t) }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: `1.2fr repeat(${cols - 1}, 1fr)`,
              height: 104,
              alignItems: "center",
              background: i === 0 ? t.accent : i % 2 ? "transparent" : withAlpha(t.text, 0.04),
              color: i === 0 ? t.accentInk : t.text,
              borderTop: i > 1 ? `1.5px solid ${t.line}` : "none",
            }}
          >
            {Array.from({ length: cols }, (_, j) => (
              <div key={j} style={{ padding: "0 26px", fontSize: i === 0 ? 28 : 30, fontWeight: i === 0 || j === 0 ? 800 : 500, textAlign: j === 0 ? "left" : "center" }}>
                {r[j] ?? ""}
              </div>
            ))}
          </div>
        ))}
      </div>
    </FitBox>
  );
}

// ——— Notas adhesivas ———
export function StickyNotesVisual({ p, t }: VisualProps) {
  const notes = lines(p.items).slice(0, 6);
  const tints = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#ddd6fe"];
  const cols = notes.length > 4 ? 3 : 2;
  const rows = Math.ceil(notes.length / cols);
  return (
    <FitBox w={960} h={rows * 330}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: 300, gap: 30, padding: 10 }}>
        {notes.map((n, i) => (
          <div
            key={i}
            style={{
              background: tints[i % tints.length],
              color: "#1f2937",
              borderRadius: 6,
              padding: "44px 30px 30px",
              transform: `rotate(${[-2.5, 2, -1.5, 3, -2, 1.5][i % 6]}deg)`,
              boxShadow: "0 24px 40px -18px rgba(0,0,0,0.55)",
              fontFamily: "'Bricolage Grotesque Variable', sans-serif",
              fontSize: cols === 3 ? 32 : 38,
              fontWeight: 700,
              lineHeight: 1.2,
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: -14, left: "50%", marginLeft: -50, width: 100, height: 30, background: "rgba(255,255,255,0.55)", transform: "rotate(-3deg)" }} />
            {n}
          </div>
        ))}
      </div>
    </FitBox>
  );
}

// ——— Publicación de red social ———
export function PostVisual({ p, t, d3 }: VisualProps) {
  return (
    <FitBox w={880} h={Math.min(640, 300 + Math.ceil(p.text.length / 38) * 48)}>
      <div style={{ ...cardStyle(t, { borderRadius: 34 }), position: "absolute", inset: 0, padding: "36px 42px", ...font(t), ...depth(d3, 8) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 76, height: 76, borderRadius: 99, background: `linear-gradient(135deg, ${t.accent}, ${mix(t.accent, t.bg, 0.5)})`, display: "grid", placeItems: "center", color: t.accentInk, fontWeight: 800, fontSize: 32 }}>
            {(p.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{p.name}</div>
            <div style={{ fontSize: 24, color: withAlpha(t.text, 0.5) }}>{p.handle}</div>
          </div>
        </div>
        <div style={{ marginTop: 26, fontSize: 36, lineHeight: 1.35 }}>{p.text}</div>
        <div style={{ position: "absolute", left: 42, bottom: 34, display: "flex", gap: 40, fontSize: 26, color: withAlpha(t.text, 0.6) }}>
          <span>
            <span style={{ color: "#ef4444" }}>♥</span> {p.likes}
          </span>
          <span>💬 {p.comments}</span>
        </div>
        <IllustrationTag t={t} style={{ right: 40, top: 46 }} />
      </div>
    </FitBox>
  );
}

// ——— Notificaciones ———
export function NotificationsVisual({ p, t }: VisualProps) {
  const items = lines(p.items).slice(0, 5);
  return (
    <FitBox w={860} h={items.length * 150 + 40}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 20, ...font(t) }}>
        {items.map((n, i) => (
          <div
            key={i}
            style={{
              ...cardStyle(t, { borderRadius: 32 }),
              background: withAlpha(t.dark ? "#ffffff" : "#ffffff", t.dark ? 0.08 : 0.8),
              backdropFilter: "blur(10px)",
              padding: "24px 30px",
              display: "flex",
              gap: 22,
              alignItems: "center",
              transform: `scale(${1 - i * 0.03})`,
              opacity: 1 - i * 0.12,
            }}
          >
            <div style={{ width: 70, height: 70, borderRadius: 18, background: t.accent, color: t.accentInk, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 32, flexShrink: 0 }}>
              {(p.app || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", gap: 14, fontSize: 22, color: withAlpha(t.text, 0.55), fontWeight: 600 }}>
                <span>{p.app}</span>
                <span>· ahora</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 600, marginTop: 4 }}>{n}</div>
            </div>
          </div>
        ))}
        <IllustrationTag t={t} style={{ right: 6, bottom: 0 }} />
      </div>
    </FitBox>
  );
}

// ——— Polaroid ———
export function PolaroidVisual({ p, t, image }: VisualProps) {
  return (
    <FitBox w={720} h={820}>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 30,
          width: 600,
          height: 740,
          background: "#fbfaf7",
          padding: "34px 34px 0",
          transform: "rotate(-3deg)",
          boxShadow: "0 50px 80px -30px rgba(0,0,0,0.75)",
        }}
      >
        <div style={{ width: 532, height: 560, background: image ? "#000" : `linear-gradient(160deg, ${mix(t.accent, "#ffffff", 0.4)}, ${t.accent})`, overflow: "hidden" }}>
          {image && (
            <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
        </div>
        <div style={{ height: 146, display: "grid", placeItems: "center", fontFamily: "'Bricolage Grotesque Variable', sans-serif", fontSize: 44, fontWeight: 700, color: "#27272a" }}>{p.caption}</div>
      </div>
    </FitBox>
  );
}
