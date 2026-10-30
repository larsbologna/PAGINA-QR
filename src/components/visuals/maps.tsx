"use client";
// Visuales de la plantilla de Google Maps. Son ilustraciones inspiradas en interfaces de
// mapas y mensajería: no usan logos ni pretenden ser capturas reales, y lo indican.
import { mix, withAlpha } from "@/lib/color";
import type { SlideTheme } from "@/components/slide/theme";
import { FitBox, IllustrationTag, Stars, cardStyle, depth } from "./base";
import { QrMatrix, type VisualProps } from "./general";

const PIN = "#ea4335";
const STAR = "#fbbc04";
const OPEN = "#34a853";

function Pin({ size = 40, color = PIN }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 24 31">
      <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.3 12 31 12 31s12-10.7 12-19.3C24 5.2 18.6 0 12 0z" fill={color} />
      <circle cx="12" cy="11.5" r="4.4" fill="#ffffff" fillOpacity="0.95" />
    </svg>
  );
}

/** Ilustraciones simples de comida/lugar para las fotos de reseñas. */
function FoodArt({ kind, t }: { kind: number; t: SlideTheme }) {
  const bgs = ["#3b2416", "#1f2a1c", "#2b1b2c", "#162433"];
  const bg = bgs[kind % bgs.length];
  return (
    <svg viewBox="0 0 200 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <defs>
        <radialGradient id={`fa-light-${kind}`} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <rect width="200" height="150" fill={bg} />
      {kind % 4 === 0 && (
        <g>
          <circle cx="100" cy="80" r="58" fill="#d9a35b" />
          <circle cx="100" cy="80" r="50" fill="#e8c26a" />
          <circle cx="100" cy="80" r="47" fill="#f3d27a" />
          {[[80, 60], [118, 62], [96, 92], [124, 96], [74, 96], [104, 70]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill="#b8322a" />
          ))}
          {[[88, 76], [112, 84], [100, 104]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="5" ry="3" fill="#3f7d3a" />
          ))}
        </g>
      )}
      {kind % 4 === 1 && (
        <g>
          <ellipse cx="100" cy="112" rx="70" ry="16" fill="#00000055" />
          <rect x="60" y="45" width="80" height="66" rx="10" fill="#f2efe9" />
          <rect x="66" y="51" width="68" height="20" rx="6" fill="#6b3f22" />
          <path d="M140 60 q24 4 0 30" stroke="#f2efe9" strokeWidth="9" fill="none" />
          <path d="M84 30 q6 -10 0 -18 M100 30 q6 -10 0 -18 M116 30 q6 -10 0 -18" stroke="#ffffff55" strokeWidth="4" fill="none" />
        </g>
      )}
      {kind % 4 === 2 && (
        <g>
          <circle cx="100" cy="80" r="56" fill="#f5f1ea" />
          <circle cx="100" cy="80" r="42" fill="#efe7da" />
          <path d="M70 84 q30 -30 60 0 q-30 26 -60 0z" fill="#c9672e" />
          <circle cx="86" cy="76" r="6" fill="#4c8b3f" />
          <circle cx="112" cy="88" r="6" fill="#4c8b3f" />
        </g>
      )}
      {kind % 4 === 3 && (
        <g>
          <rect x="30" y="40" width="140" height="100" fill="#20303f" />
          <rect x="30" y="34" width="140" height="18" fill={t.accent} />
          <rect x="44" y="64" width="50" height="76" fill="#ffd27a" fillOpacity="0.85" />
          <rect x="106" y="64" width="50" height="46" fill="#ffd27a" fillOpacity="0.6" />
          <circle cx="60" cy="104" r="8" fill="#3a2a1a" />
          <circle cx="78" cy="110" r="8" fill="#3a2a1a" />
          <circle cx="124" cy="92" r="7" fill="#3a2a1a" />
        </g>
      )}
      <rect width="200" height="150" fill={`url(#fa-light-${kind})`} />
    </svg>
  );
}

// ——— Local vacío vs. local lleno ———
function Storefront({ full, t, label }: { full: boolean; t: SlideTheme; label: string }) {
  const wall = full ? mix(t.surface, t.accent, 0.08) : mix(t.surface, t.bg, 0.4);
  const glass = full ? "#ffcf7a" : "#2a2f36";
  const people = full
    ? [
        [70, 250, "#2d1f17"],
        [120, 262, "#3b2a1f"],
        [170, 246, "#2a1c14"],
        [250, 258, "#33241b"],
        [300, 248, "#2b1d15"],
        [345, 262, "#3a281d"],
      ]
    : [];
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <div style={{ ...cardStyle(t, { borderRadius: 34, overflow: "hidden", position: "relative", height: 470, background: wall, opacity: full ? 1 : 0.85 }) }}>
        <svg viewBox="0 0 420 470" width="100%" height="100%" style={{ display: "block" }}>
          <defs>
            <linearGradient id={`glow-${full}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={glass} stopOpacity={full ? 0.95 : 0.6} />
              <stop offset="1" stopColor={glass} stopOpacity={full ? 0.6 : 0.3} />
            </linearGradient>
          </defs>
          {/* toldo */}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${i * 52.5} 40 h52.5 v46 q-26 18 -52.5 0z`} fill={i % 2 ? (full ? t.accent : "#4a4f57") : full ? mix(t.accent, "#ffffff", 0.55) : "#61666e"} />
          ))}
          {/* vidriera */}
          <rect x="30" y="110" width="360" height="250" rx="10" fill={`url(#glow-${full})`} />
          <rect x="30" y="110" width="360" height="250" rx="10" fill="none" stroke="#00000044" strokeWidth="6" />
          <line x1="210" y1="110" x2="210" y2="360" stroke="#00000044" strokeWidth="6" />
          {/* lámparas */}
          {[110, 310].map((x) => (
            <g key={x}>
              <line x1={x} y1="110" x2={x} y2="140" stroke="#00000066" strokeWidth="3" />
              <path d={`M${x - 18} 158 h36 l-8 -18 h-20z`} fill={full ? "#fff3d0" : "#3a3f46"} />
              {full && <circle cx={x} cy="170" r="40" fill="#fff6d8" fillOpacity="0.35" />}
            </g>
          ))}
          {/* mesas */}
          {[90, 330].map((x) => (
            <g key={x}>
              <rect x={x - 40} y="300" width="80" height="10" rx="4" fill="#00000077" />
              <rect x={x - 4} y="310" width="8" height="50" fill="#00000066" />
            </g>
          ))}
          {/* clientes */}
          {people.map(([x, y, c], i) => (
            <g key={i}>
              <circle cx={x as number} cy={(y as number) - 34} r="17" fill={c as string} />
              <path d={`M${(x as number) - 26} ${(y as number) + 50} q26 -90 52 0z`} fill={c as string} />
            </g>
          ))}
          {/* vereda */}
          <rect x="0" y="380" width="420" height="90" fill="#00000033" />
          {!full && (
            <g>
              <rect x="150" y="200" width="120" height="46" rx="8" fill="#1d2127" stroke="#ffffff33" strokeWidth="2" />
              <text x="210" y="231" fontSize="22" fontWeight="700" textAnchor="middle" fill="#ffffff88" fontFamily="Inter Variable, sans-serif">
                VACÍO
              </text>
            </g>
          )}
        </svg>
      </div>
      <div
        style={{
          marginTop: 22,
          textAlign: "center",
          fontSize: 30,
          fontWeight: 700,
          color: full ? t.accent : withAlpha(t.text, 0.55),
          fontFamily: t.bodyFamily,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function StoreContrastVisual({ p, t }: VisualProps) {
  return (
    <FitBox w={980} h={560}>
      <div style={{ position: "absolute", inset: 0, display: "flex", gap: 40 }}>
        <Storefront full={false} t={t} label={p.leftLabel} />
        <Storefront full t={t} label={p.rightLabel} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 490 - 42,
          top: 235 - 42,
          width: 84,
          height: 84,
          borderRadius: 99,
          background: t.accent,
          color: t.accentInk,
          display: "grid",
          placeItems: "center",
          fontSize: 32,
          fontWeight: 900,
          fontFamily: t.titleFamily,
          boxShadow: `0 0 0 10px ${t.bg}`,
        }}
      >
        VS
      </div>
    </FitBox>
  );
}

// ——— Dos fichas de Maps ———
function PlaceCard({ name, rating, count, category, t, highlight, art }: { name: string; rating: number; count: string; category: string; t: SlideTheme; highlight: boolean; art: number }) {
  return (
    <div
      style={{
        ...cardStyle(t, { borderRadius: 30, overflow: "hidden", position: "relative" }),
        flex: 1,
        border: `3px solid ${highlight ? t.accent : t.line}`,
        opacity: highlight ? 1 : 0.78,
        boxShadow: highlight ? `0 30px 90px -30px ${withAlpha(t.accent, 0.6)}` : cardStyle(t).boxShadow,
      }}
    >
      <div style={{ display: "flex", height: 170, gap: 4 }}>
        {[art, art + 1, art + 2].map((k) => (
          <div key={k} style={{ flex: 1, overflow: "hidden", filter: highlight ? "none" : "saturate(0.35) brightness(0.8)" }}>
            <FoodArt kind={k} t={t} />
          </div>
        ))}
      </div>
      <div style={{ padding: "26px 30px 30px", fontFamily: t.bodyFamily, color: t.text }}>
        <div style={{ fontSize: 36, fontWeight: 700 }}>{name}</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 30 }}>
          <span style={{ fontWeight: 700 }}>{rating.toFixed(1).replace(".", ",")}</span>
          <Stars n={rating} size={30} color={STAR} dim={withAlpha(t.text, 0.2)} />
          <span style={{ color: withAlpha(t.text, 0.55) }}>({count})</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 25, color: withAlpha(t.text, 0.6) }}>
          {category} · <span style={{ color: OPEN }}>Abierto</span>
        </div>
      </div>
    </div>
  );
}

export function MapsCompareVisual({ p, t }: VisualProps) {
  const a = Number(p.aRating.replace(",", ".")) || 0;
  const b = Number(p.bRating.replace(",", ".")) || 0;
  return (
    <FitBox w={980} h={600}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", gap: 36 }}>
        <PlaceCard name={p.aName} rating={a} count={p.aCount} category={p.category} t={t} highlight={false} art={2} />
        <PlaceCard name={p.bName} rating={b} count={p.bCount} category={p.category} t={t} highlight art={0} />
      </div>
      {/* flecha hacia el negocio B */}
      <svg width="240" height="120" viewBox="0 0 240 120" style={{ position: "absolute", right: 140, top: -40 }}>
        <path d="M10 100 C 70 10, 160 0, 214 52" stroke={t.accent} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M192 30 L222 60 L182 68" stroke={t.accent} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <IllustrationTag t={t} style={{ left: 4, top: 4 }} />
    </FitBox>
  );
}

// ——— Búsqueda local ———
export function MapsSearchVisual({ p, t, d3 }: VisualProps) {
  const results = [p.r1, p.r2, p.r3].filter(Boolean);
  const ratings = [4.8, 4.6, 4.3];
  const counts = [214, 98, 41];
  const road = withAlpha(t.text, 0.12);
  return (
    <FitBox w={960} h={330 + 60 + [p.r1, p.r2, p.r3].filter(Boolean).length * 126 + 30}>
      <div style={{ ...cardStyle(t, { borderRadius: 40, overflow: "hidden" }), position: "absolute", inset: 0, ...depth(d3, 8) }}>
        {/* mapa */}
        <svg viewBox="0 0 960 330" width="960" height="330" style={{ display: "block", background: mix(t.surface, t.bg, 0.35) }}>
          {[60, 150, 250, 330].map((y, i) => (
            <path key={`h${i}`} d={`M0 ${y} Q 480 ${y + (i % 2 ? 30 : -30)} 960 ${y + 10}`} stroke={road} strokeWidth={i === 1 ? 22 : 12} fill="none" />
          ))}
          {[120, 330, 560, 800].map((x, i) => (
            <path key={`v${i}`} d={`M${x} 0 L ${x + (i % 2 ? 40 : -30)} 330`} stroke={road} strokeWidth={i === 2 ? 20 : 11} fill="none" />
          ))}
          <rect x="620" y="170" width="140" height="70" rx="12" fill={withAlpha(OPEN, 0.18)} />
          <circle cx="430" cy="200" r="70" fill={withAlpha("#4285f4", 0.12)} />
          <circle cx="430" cy="200" r="13" fill="#4285f4" stroke="#ffffff" strokeWidth="5" />
        </svg>
        {[
          [230, 140],
          [650, 130],
          [520, 225],
        ].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y }}>
            <Pin size={i === 0 ? 52 : 40} color={i === 0 ? PIN : mix(PIN, t.surface, 0.3)} />
          </div>
        ))}
        {/* barra de búsqueda */}
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 26,
            height: 76,
            borderRadius: 99,
            background: t.surface,
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 30px",
            fontSize: 30,
            color: t.text,
            fontFamily: t.bodyFamily,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={withAlpha(t.text, 0.6)} strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          {p.query}
        </div>
        {/* resultados */}
        <div style={{ padding: "18px 34px", fontFamily: t.bodyFamily, color: t.text }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 22, padding: "20px 0", borderBottom: i < results.length - 1 ? `1.5px solid ${t.line}` : "none" }}
            >
              <div style={{ width: 84, height: 84, borderRadius: 18, overflow: "hidden", flexShrink: 0 }}>
                <FoodArt kind={i === 2 ? 3 : i} t={t} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 31, fontWeight: 700 }}>{r}</div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: withAlpha(t.text, 0.6) }}>
                  <span style={{ color: t.text, fontWeight: 700 }}>{ratings[i].toFixed(1).replace(".", ",")}</span>
                  <Stars n={ratings[i]} size={22} color={STAR} dim={withAlpha(t.text, 0.2)} />({counts[i]}) · {(0.3 + i * 0.4).toFixed(1).replace(".", ",")} km
                </div>
              </div>
            </div>
          ))}
        </div>
        <IllustrationTag t={t} style={{ right: 34, bottom: 18 }} />
      </div>
    </FitBox>
  );
}

// ——— Pilares de presencia ———
const PILLAR_ICONS = [
  <path key="s" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />,
  <g key="c">
    <rect x="3" y="7" width="18" height="13" rx="3" />
    <circle cx="12" cy="13.5" r="3.5" />
    <path d="M8 7l2-3h4l2 3" />
  </g>,
  <path key="m" d="M4 5h16v11H9l-5 4z" />,
  <g key="i">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.5" />
  </g>,
];

export function PresenceMixVisual({ p, t }: VisualProps) {
  const pillars = [p.p1, p.p2, p.p3, p.p4];
  return (
    <FitBox w={980} h={600}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", alignItems: "center", gap: 14, fontFamily: t.bodyFamily }}>
        {pillars.map((name, i) => (
          <div key={i} style={{ display: "contents" }}>
            <div style={{ ...cardStyle(t, { borderRadius: 30 }), flex: 1, height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
              <div style={{ width: 96, height: 96, borderRadius: 28, background: withAlpha(t.accent, 0.15), display: "grid", placeItems: "center" }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {PILLAR_ICONS[i]}
                </svg>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: t.text, textAlign: "center", padding: "0 10px" }}>{name}</div>
            </div>
            {i < 3 && <div style={{ fontSize: 50, fontWeight: 800, color: withAlpha(t.text, 0.4) }}>+</div>}
          </div>
        ))}
      </div>
      <svg width="980" height="110" viewBox="0 0 980 110" style={{ position: "absolute", top: 270, left: 0 }}>
        {[118, 368, 612, 860].map((x) => (
          <path key={x} d={`M${x} 0 C ${x} 60, 490 40, 490 100`} stroke={withAlpha(t.accent, 0.5)} strokeWidth="4" fill="none" strokeDasharray="10 10" />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 390,
          height: 150,
          borderRadius: 36,
          background: t.accent,
          color: t.accentInk,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          fontFamily: t.titleFamily,
          fontWeight: t.titleWeight,
          fontSize: 40,
          textAlign: "center",
          padding: "0 30px",
          boxShadow: `0 30px 80px -30px ${withAlpha(t.accent, 0.8)}`,
        }}
      >
        <Pin size={42} color={t.accentInk} />
        {p.result}
      </div>
    </FitBox>
  );
}

// ——— Soporte QR sobre una mesa ———
export function QrStandVisual({ p, t, d3 }: VisualProps) {
  return (
    <FitBox w={980} h={720}>
      {/* mesa */}
      <svg width="980" height="720" viewBox="0 0 980 720" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6b4a32" />
            <stop offset="1" stopColor="#3b271a" />
          </linearGradient>
          <radialGradient id="tableLight" cx="0.5" cy="0.2" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M120 470 L860 470 L980 720 L0 720 Z" fill="url(#table)" />
        <path d="M120 470 L860 470 L980 720 L0 720 Z" fill="url(#tableLight)" />
        {[530, 600, 680].map((y, i) => (
          <path key={y} d={`M${90 - i * 30} ${y} Q 490 ${y - 12} ${890 + i * 30} ${y}`} stroke="#00000022" strokeWidth="3" fill="none" />
        ))}
        <ellipse cx="490" cy="640" rx="230" ry="26" fill="#00000066" />
        {/* taza */}
        <ellipse cx="800" cy="590" rx="90" ry="22" fill="#00000055" />
        <path d="M730 520 h130 l-12 70 q-53 18 -106 0z" fill="#f2efe9" />
        <ellipse cx="795" cy="520" rx="65" ry="16" fill="#e4ddd2" />
        <ellipse cx="795" cy="521" rx="54" ry="11" fill="#5a3520" />
        <path d="M858 532 q40 8 4 44" stroke="#f2efe9" strokeWidth="12" fill="none" />
      </svg>
      {/* soporte tipo atril */}
      <div style={{ position: "absolute", left: 300, top: 20, width: 380, height: 620, ...depth(d3, 12) }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 30,
            background: `linear-gradient(160deg, ${mix(t.surface, "#ffffff", 0.06)}, ${t.surface})`,
            border: `3px solid ${withAlpha("#ffffff", 0.14)}`,
            boxShadow: "0 50px 80px -30px rgba(0,0,0,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "40px 34px",
            fontFamily: t.bodyFamily,
            color: t.text,
          }}
        >
          <div style={{ fontFamily: t.titleFamily, fontWeight: t.titleWeight, fontSize: 52, lineHeight: 1, textAlign: "center" }}>{p.headline}</div>
          <div style={{ marginTop: 14 }}>
            <Stars n={5} size={34} color={STAR} />
          </div>
          <div style={{ marginTop: 26, padding: 16, borderRadius: 22, background: "#ffffff" }}>
            <QrMatrix text={p.seed || "https://ejemplo.com"} size={220} color="#0a0a0a" background="#ffffff" />
          </div>
          <div style={{ marginTop: 24, fontSize: 25, lineHeight: 1.3, textAlign: "center", color: withAlpha(t.text, 0.8) }}>{p.sub}</div>
        </div>
        <div style={{ position: "absolute", left: 20, right: 20, bottom: -18, height: 18, borderRadius: "0 0 14px 14px", background: "#00000088" }} />
      </div>
    </FitBox>
  );
}

// ——— Respuesta a una reseña ———
export function ReviewReplyVisual({ p, t }: VisualProps) {
  return (
    <FitBox w={940} h={Math.min(760, 330 + Math.ceil(p.review.length / 46) * 44 + Math.ceil(p.reply.length / 46) * 41)}>
      <div style={{ ...cardStyle(t), position: "absolute", inset: 0, padding: "38px 42px", fontFamily: t.bodyFamily, color: t.text }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 70, height: 70, borderRadius: 99, background: "#5e7ce2", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 32, color: "#fff" }}>
            {(p.author || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 31, fontWeight: 700 }}>{p.author}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 22, color: withAlpha(t.text, 0.5) }}>
              <Stars n={5} size={26} color={STAR} dim={withAlpha(t.text, 0.2)} /> hace 2 días
            </div>
          </div>
        </div>
        <div style={{ marginTop: 22, fontSize: 32, lineHeight: 1.35, color: withAlpha(t.text, 0.88) }}>{p.review}</div>
        <div style={{ marginTop: 30, marginLeft: 30, padding: "24px 28px", borderRadius: 22, background: withAlpha(t.accent, 0.1), borderLeft: `6px solid ${t.accent}` }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.accent, letterSpacing: "0.02em" }}>{p.business}</div>
          <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1.35 }}>{p.reply}</div>
        </div>
        <IllustrationTag t={t} style={{ right: 40, top: 46 }} />
      </div>
    </FitBox>
  );
}

// ——— Chat estilo WhatsApp ———
export function WhatsappChatVisual({ p, t, d3 }: VisualProps) {
  const msgs = [
    { me: true, text: p.m1 },
    { me: false, text: p.m2 },
    { me: true, text: p.m3, link: true },
  ].filter((m) => m.text);
  const ink = "#e9edef";
  return (
    <FitBox w={700} h={800}>
      <div
        style={{
          position: "absolute",
          inset: "0 0 40px 0",
          borderRadius: 50,
          overflow: "hidden",
          background: "#0b141a",
          border: `3px solid ${withAlpha("#ffffff", 0.12)}`,
          boxShadow: "0 50px 90px -30px rgba(0,0,0,0.85)",
          fontFamily: t.bodyFamily,
          ...depth(d3, 10),
        }}
      >
        <div style={{ height: 120, background: "#1f2c34", display: "flex", alignItems: "center", gap: 18, padding: "0 30px", color: ink }}>
          <span style={{ fontSize: 34, opacity: 0.8 }}>←</span>
          <div style={{ width: 66, height: 66, borderRadius: 99, background: t.accent, color: t.accentInk, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 30 }}>
            {(p.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 21, color: "#8696a0" }}>en línea</div>
          </div>
        </div>
        <div
          style={{
            padding: "34px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            backgroundImage: "radial-gradient(#ffffff0d 2px, transparent 2px)",
            backgroundSize: "34px 34px",
            height: "100%",
          }}
        >
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.me ? "flex-end" : "flex-start",
                maxWidth: "82%",
                padding: m.link ? 10 : "16px 22px 12px",
                borderRadius: m.me ? "22px 6px 22px 22px" : "6px 22px 22px 22px",
                background: m.me ? "#005c4b" : "#202c33",
                color: ink,
                fontSize: 28,
                lineHeight: 1.32,
              }}
            >
              {m.link && (
                <div style={{ display: "flex", gap: 14, alignItems: "center", padding: 14, borderRadius: 14, background: "#00000033", marginBottom: 10 }}>
                  <div style={{ width: 70, height: 70, borderRadius: 12, background: "#ffffff", display: "grid", placeItems: "center" }}>
                    <Pin size={34} />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>Dejanos tu reseña</div>
                    <div style={{ fontSize: 20, color: "#a5d6c9" }}>Enlace directo a la ficha</div>
                  </div>
                </div>
              )}
              <div style={{ padding: m.link ? "0 12px 2px" : 0 }}>{m.text}</div>
              <div style={{ textAlign: "right", fontSize: 18, color: "#8696a0", marginTop: 4, paddingRight: m.link ? 12 : 0 }}>
                {`21:${10 + i * 3}`} {m.me && <span style={{ color: "#53bdeb" }}>✓✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <IllustrationTag t={t} style={{ right: 4, bottom: 0 }} />
    </FitBox>
  );
}

// ——— Reseñas con foto ———
export function PhotoReviewsVisual({ p, t, image }: VisualProps) {
  const reviews = [p.r1, p.r2, p.r3, p.r4];
  const names = ["Sofi R.", "Nico P.", "Carla V.", "Juan M."];
  return (
    <FitBox w={980} h={800}>
      <div style={{ position: "absolute", inset: "0 0 40px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, fontFamily: t.bodyFamily }}>
        {reviews.map((r, i) => (
          <div key={i} style={{ ...cardStyle(t, { borderRadius: 28, overflow: "hidden" }), display: "flex", flexDirection: "column", transform: `rotate(${[-1.2, 1, 0.8, -0.9][i]}deg)` }}>
            <div style={{ height: 210, overflow: "hidden" }}>
              {i === 0 && image ? (
                // Primera foto: la imagen subida, si hay.
                <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <FoodArt kind={i} t={t} />
              )}
            </div>
            <div style={{ padding: "18px 22px 22px", color: t.text }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{names[i]}</span>
                <Stars n={5} size={22} color={STAR} />
              </div>
              <div style={{ marginTop: 8, fontSize: 25, lineHeight: 1.3, color: withAlpha(t.text, 0.8) }}>{r}</div>
            </div>
          </div>
        ))}
      </div>
      <IllustrationTag t={t} style={{ right: 4, bottom: 0 }} />
    </FitBox>
  );
}
