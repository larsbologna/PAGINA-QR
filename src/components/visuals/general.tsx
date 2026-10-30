"use client";
import qrcode from "qrcode-generator";
import { mix, withAlpha } from "@/lib/color";
import type { SlideTheme } from "@/components/slide/theme";
import { FitBox, IllustrationTag, Stars, cardStyle, depth, lines, list } from "./base";

export interface VisualProps {
  p: Record<string, string>;
  t: SlideTheme;
  image?: string;
  /** Estilo de imágenes "Ilustraciones 3D". */
  d3: boolean;
}

// ——— Fotografía integrada: la imagen se funde con el fondo, sin recuadro blanco ———
export function PhotoVisual({ p, t, image }: VisualProps) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 40, overflow: "hidden", background: t.surface }}>
      {image ? (
        <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: `radial-gradient(circle at 30% 20%, ${withAlpha(t.accent, 0.35)}, transparent 55%), linear-gradient(160deg, ${t.surface}, ${mix(t.surface, t.bg, 0.6)})`,
            color: withAlpha(t.text, 0.4),
            fontSize: 30,
            fontFamily: t.bodyFamily,
          }}
        >
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="M21 16l-5-5-8 8" />
          </svg>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 55%, ${withAlpha(t.bg, 0.85)})` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, boxShadow: `inset 0 0 0 2px ${withAlpha(t.text, 0.08)}` }} />
      {p.caption && (
        <div style={{ position: "absolute", left: 36, bottom: 30, right: 36, fontSize: 30, fontWeight: 600, color: t.text, fontFamily: t.bodyFamily }}>{p.caption}</div>
      )}
    </div>
  );
}

// ——— Teléfono ———
export function PhoneVisual({ p, t, image, d3 }: VisualProps) {
  const rows = [p.line1, p.line2, p.line3].filter(Boolean);
  return (
    <FitBox w={900} h={760}>
      <div style={{ position: "absolute", width: 520, height: 520, left: 190, top: 120, borderRadius: "50%", background: withAlpha(t.accent, 0.22), filter: "blur(70px)" }} />
      <div style={{ position: "absolute", left: 270, top: 10, width: 360, height: 740, ...depth(d3) }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 64,
            background: "#0d0d0f",
            boxShadow: `0 0 0 3px ${withAlpha(t.text, 0.18)}, 0 50px 90px -30px rgba(0,0,0,0.8)`,
            padding: 14,
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 52, overflow: "hidden", background: mix(t.surface, "#ffffff", t.dark ? 0.04 : 0.6) }}>
            {image ? (
              <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ padding: "64px 26px 26px", fontFamily: t.bodyFamily, color: t.text }}>
                <div style={{ height: 150, borderRadius: 22, background: `linear-gradient(135deg, ${t.accent}, ${mix(t.accent, t.bg, 0.55)})` }} />
                <div style={{ marginTop: 22, fontSize: 30, fontWeight: 700 }}>{p.app}</div>
                <div style={{ marginTop: 6 }}>
                  <Stars n={4.8} size={22} color={t.accent} dim={withAlpha(t.text, 0.2)} />
                </div>
                {rows.map((r, i) => (
                  <div
                    key={i}
                    style={{ marginTop: 16, padding: "16px 18px", borderRadius: 16, background: withAlpha(t.text, 0.06), fontSize: 21, display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ width: 12, height: 12, borderRadius: 99, background: i === 0 ? t.accent : withAlpha(t.text, 0.3) }} />
                    {r}
                  </div>
                ))}
              </div>
            )}
            <div style={{ position: "absolute", top: 14, left: "50%", width: 110, height: 30, marginLeft: -55, borderRadius: 99, background: "#0d0d0f" }} />
          </div>
        </div>
      </div>
      <IllustrationTag t={t} style={{ right: 20, bottom: 0 }} />
    </FitBox>
  );
}

// ——— Gráfico de barras ———
export function StatsVisual({ p, t }: VisualProps) {
  const labels = list(p.labels);
  const values = list(p.values).map((v) => Number(v.replace(",", ".")) || 0);
  const n = Math.max(1, Math.min(labels.length || values.length, 8));
  const max = Math.max(1, ...values);
  const W = 940;
  const H = 640;
  const chartH = 420;
  const bw = Math.min(110, (W - 120) / n - 26);
  return (
    <FitBox w={W} h={H}>
      <div style={{ ...cardStyle(t), position: "absolute", inset: 0, padding: "36px 44px", fontFamily: t.bodyFamily, color: t.text }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{p.title}</div>
          {p.note && <div style={{ fontSize: 20, color: withAlpha(t.text, 0.5) }}>{p.note}</div>}
        </div>
        <div style={{ position: "absolute", left: 44, right: 44, bottom: 80, height: chartH, display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <div key={g} style={{ position: "absolute", left: 0, right: 0, bottom: chartH * g, borderTop: `1.5px dashed ${withAlpha(t.text, 0.1)}` }} />
          ))}
          {Array.from({ length: n }, (_, i) => {
            const v = values[i] ?? 0;
            const last = i === n - 1;
            return (
              <div key={i} style={{ position: "relative", width: bw, height: Math.max(8, (v / max) * (chartH - 40)), borderRadius: "18px 18px 6px 6px", background: last ? t.accent : withAlpha(t.text, 0.16) }}>
                <div style={{ position: "absolute", top: -40, width: "100%", textAlign: "center", fontSize: 24, fontWeight: 700, color: last ? t.accent : withAlpha(t.text, 0.7) }}>{v}</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 44, right: 44, bottom: 30, display: "flex", justifyContent: "space-around" }}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} style={{ width: bw, textAlign: "center", fontSize: 21, color: withAlpha(t.text, 0.6), whiteSpace: "nowrap" }}>
              {labels[i] ?? ""}
            </div>
          ))}
        </div>
      </div>
    </FitBox>
  );
}

// ——— Pasos ———
export function StepsVisual({ p, t }: VisualProps) {
  const steps = [p.s1, p.s2, p.s3, p.s4].filter(Boolean);
  const H = 170 * steps.length + 20;
  return (
    <FitBox w={940} h={Math.max(H, 360)}>
      <div style={{ position: "absolute", left: 66, top: 70, bottom: 70, width: 4, background: `linear-gradient(${t.accent}, ${withAlpha(t.accent, 0.1)})`, borderRadius: 4 }} />
      {steps.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * 170 + 10, height: 140, display: "flex", alignItems: "center", gap: 34 }}>
          <div
            style={{
              width: 136,
              height: 136,
              flexShrink: 0,
              borderRadius: 40,
              display: "grid",
              placeItems: "center",
              background: i === steps.length - 1 ? t.accent : t.surface,
              color: i === steps.length - 1 ? t.accentInk : t.accent,
              border: `2px solid ${i === steps.length - 1 ? t.accent : t.line}`,
              fontFamily: t.titleFamily,
              fontWeight: t.titleWeight,
              fontSize: 64,
            }}
          >
            {i + 1}
          </div>
          <div style={{ ...cardStyle(t), flex: 1, padding: "30px 36px", fontSize: 38, fontWeight: 600, color: t.text, fontFamily: t.bodyFamily, lineHeight: 1.2 }}>{s}</div>
        </div>
      ))}
    </FitBox>
  );
}

// ——— Comparativa ———
export function ComparisonVisual({ p, t }: VisualProps) {
  const col = (title: string, items: string[], good: boolean) => (
    <div
      style={{
        ...cardStyle(t),
        flex: 1,
        padding: "36px 34px",
        background: good ? withAlpha(t.accent, 0.1) : t.surface,
        border: `2px solid ${good ? t.accent : t.line}`,
        position: "relative",
      }}
    >
      <div style={{ fontSize: 26, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: good ? t.accent : withAlpha(t.text, 0.55) }}>{title}</div>
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 22 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", fontSize: 31, lineHeight: 1.25, color: good ? t.text : withAlpha(t.text, 0.65) }}>
            <span
              style={{
                flexShrink: 0,
                marginTop: 2,
                width: 36,
                height: 36,
                borderRadius: 99,
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                fontWeight: 800,
                background: good ? t.accent : withAlpha(t.text, 0.1),
                color: good ? t.accentInk : withAlpha(t.text, 0.6),
              }}
            >
              {good ? "✓" : "✕"}
            </span>
            {it}
          </div>
        ))}
      </div>
    </div>
  );
  const rows = Math.max(lines(p.left).length, lines(p.right).length);
  const H = Math.min(720, 160 + rows * 105);
  return (
    <FitBox w={980} h={H}>
      <div style={{ position: "absolute", inset: 0, display: "flex", gap: 28, fontFamily: t.bodyFamily }}>
        {col(p.leftTitle, lines(p.left), false)}
        {col(p.rightTitle, lines(p.right), true)}
      </div>
      <div
        style={{
          position: "absolute",
          left: 490 - 38,
          top: H / 2 - 38,
          width: 76,
          height: 76,
          borderRadius: 99,
          background: t.bg,
          border: `2px solid ${t.line}`,
          display: "grid",
          placeItems: "center",
          color: t.accent,
          fontSize: 38,
          fontWeight: 800,
        }}
      >
        →
      </div>
    </FitBox>
  );
}

// ——— Checklist ———
export function ChecklistVisual({ p, t }: VisualProps) {
  const items = lines(p.items);
  const H = Math.max(300, items.length * 130 + 40);
  return (
    <FitBox w={940} h={H}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 20, justifyContent: "center", fontFamily: t.bodyFamily }}>
        {items.map((it, i) => (
          <div key={i} style={{ ...cardStyle(t, { borderRadius: 24 }), display: "flex", alignItems: "center", gap: 26, padding: "26px 32px", fontSize: 36, fontWeight: 600, color: t.text }}>
            <span style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: t.accent, color: t.accentInk, display: "grid", placeItems: "center", fontSize: 34, fontWeight: 900 }}>✓</span>
            {it}
          </div>
        ))}
      </div>
    </FitBox>
  );
}

// ——— Cita ———
export function QuoteVisual({ p, t }: VisualProps) {
  return (
    <FitBox w={940} h={Math.min(640, 240 + Math.ceil(p.text.length / 30) * 64 + (p.author ? 70 : 0))}>
      <div style={{ ...cardStyle(t), position: "absolute", inset: 0, padding: "60px 64px", fontFamily: t.bodyFamily, color: t.text, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: -30, left: 50, fontSize: 220, lineHeight: 1, fontFamily: "'Playfair Display Variable', serif", color: t.accent }}>“</div>
        <div style={{ fontSize: 50, lineHeight: 1.25, fontWeight: 600 }}>{p.text}</div>
        {p.author && <div style={{ marginTop: 30, fontSize: 28, color: withAlpha(t.text, 0.55) }}>— {p.author}</div>}
      </div>
    </FitBox>
  );
}

// ——— Código QR (real y escaneable) ———
export function QrMatrix({ text, size, color, background }: { text: string; size: number; color: string; background: string }) {
  const qr = qrcode(0, "M");
  qr.addData(text || " ", "Byte");
  qr.make();
  const n = qr.getModuleCount();
  const q = 2; // zona silenciosa
  const cell = size / (n + q * 2);
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${(c + q) * cell},${(r + q) * cell}h${cell}v${cell}h-${cell}z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" style={{ display: "block" }}>
      <rect width={size} height={size} fill={background} rx={size * 0.06} />
      <path d={d} fill={color} />
    </svg>
  );
}

export function QrVisual({ p, t, d3 }: VisualProps) {
  return (
    <FitBox w={900} h={520}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 50, justifyContent: "center", fontFamily: t.bodyFamily }}>
        <div style={{ ...cardStyle(t, { padding: 26, borderRadius: 40, background: "#ffffff" }), ...depth(d3, 18) }}>
          <QrMatrix text={p.seed} size={380} color="#0a0a0a" background="#ffffff" />
        </div>
        <div style={{ maxWidth: 380, fontSize: 44, fontWeight: 700, lineHeight: 1.15, color: t.text }}>
          {p.label}
          <div style={{ marginTop: 22, width: 90, height: 8, borderRadius: 9, background: t.accent }} />
        </div>
      </div>
    </FitBox>
  );
}

// ——— Chat genérico ———
export function ChatVisual({ p, t }: VisualProps) {
  const msgs = [
    { me: true, text: p.m1 },
    { me: false, text: p.m2 },
    { me: true, text: p.m3 },
  ].filter((m) => m.text);
  const H = 130 + msgs.reduce((h, m) => h + 70 + Math.ceil(m.text.length / 30) * 40, 32);
  return (
    <FitBox w={900} h={H}>
      <div style={{ ...cardStyle(t), position: "absolute", inset: 0, overflow: "hidden", fontFamily: t.bodyFamily }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "24px 32px", borderBottom: `1.5px solid ${t.line}` }}>
          <div style={{ width: 58, height: 58, borderRadius: 99, background: withAlpha(t.accent, 0.25), color: t.accent, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 26 }}>
            {(p.name || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.text }}>{p.name}</div>
        </div>
        <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.me ? "flex-end" : "flex-start",
                maxWidth: "76%",
                padding: "20px 26px",
                borderRadius: m.me ? "28px 28px 8px 28px" : "28px 28px 28px 8px",
                background: m.me ? t.accent : withAlpha(t.text, 0.08),
                color: m.me ? t.accentInk : t.text,
                fontSize: 30,
                lineHeight: 1.3,
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
        <IllustrationTag t={t} style={{ right: 28, top: 36 }} />
      </div>
    </FitBox>
  );
}

// ——— Reseña ———
export function ReviewVisual({ p, t, d3 }: VisualProps) {
  const stars = Math.max(1, Math.min(5, Number(p.stars) || 5));
  return (
    <FitBox w={900} h={Math.min(560, 210 + Math.ceil(p.text.length / 40) * 50)}>
      <div style={{ ...cardStyle(t), position: "absolute", inset: 0, padding: "40px 46px", fontFamily: t.bodyFamily, color: t.text, ...depth(d3, 10) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 99, background: `linear-gradient(135deg, ${t.accent}, ${mix(t.accent, t.bg, 0.5)})`, display: "grid", placeItems: "center", color: t.accentInk, fontWeight: 800, fontSize: 32 }}>
            {(p.author || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{p.author}</div>
            <div style={{ marginTop: 6 }}>
              <Stars n={stars} size={30} dim={withAlpha(t.text, 0.2)} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 30, fontSize: 36, lineHeight: 1.35, color: withAlpha(t.text, 0.88) }}>{p.text}</div>
        <IllustrationTag t={t} style={{ right: 40, top: 44 }} />
      </div>
    </FitBox>
  );
}

// ——— Botón CTA ———
export function CtaButtonVisual({ p, t }: VisualProps) {
  return (
    <FitBox w={900} h={420}>
      <div style={{ position: "absolute", left: 120, right: 120, top: 70, height: 260, borderRadius: 999, background: withAlpha(t.accent, 0.35), filter: "blur(80px)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34, fontFamily: t.bodyFamily }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            padding: "40px 70px",
            borderRadius: 999,
            background: t.accent,
            color: t.accentInk,
            fontSize: 56,
            fontWeight: 800,
            fontFamily: t.titleFamily,
            letterSpacing: "-0.01em",
            boxShadow: `0 30px 80px -20px ${withAlpha(t.accent, 0.7)}, inset 0 -6px 0 ${withAlpha("#000000", 0.15)}`,
            whiteSpace: "nowrap",
          }}
        >
          {p.label}
          <span style={{ fontSize: 60 }}>→</span>
        </div>
        {p.handle && <div style={{ fontSize: 34, fontWeight: 600, color: withAlpha(t.text, 0.75) }}>{p.handle}</div>}
      </div>
    </FitBox>
  );
}
