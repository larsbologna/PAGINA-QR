// Fondo decorativo de ReseñaQR: estrellas y burbujas de opinión flotando en
// capas, con un degradé suave. Se genera a partir de una semilla (el negocio),
// así siempre se ve igual. No muestra datos: es solo identidad visual.
import { svg } from "./ui.js";

function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Estrella regular de 5 puntas centrada en (0,0), radio exterior 10.
const STAR = "M0-10L2.94-4.05 9.51-3.09 4.76 1.55 5.88 8.09 0 5 -5.88 8.09 -4.76 1.55 -9.51-3.09 -2.94-4.05Z";

export function reviewArt(seed, { width = 800, height = 360, cls = "review-art" } = {}) {
  const r = rng(seed);
  const id = `ra${Math.floor(r() * 1e9)}`;
  const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "xMidYMid slice", class: cls, "aria-hidden": "true", focusable: "false" });
  const defs = svg("defs", {});
  const grad = svg("linearGradient", { id: `${id}g`, x1: 0, y1: 0, x2: 1, y2: 1 });
  grad.append(svg("stop", { offset: "0", class: "ra-g1" }), svg("stop", { offset: "1", class: "ra-g2" }));
  const glow = svg("radialGradient", { id: `${id}r`, cx: 0.75, cy: 0.1, r: 0.7 });
  glow.append(svg("stop", { offset: "0", class: "ra-glow" }), svg("stop", { offset: "1", class: "ra-glow-end" }));
  defs.append(grad, glow);
  root.append(defs, svg("rect", { width, height, fill: `url(#${id}g)` }), svg("rect", { width, height, fill: `url(#${id}r)` }));

  // Retícula de puntos tipo "módulos" de un QR, muy sutil.
  const dots = svg("g", { class: "ra-dots" });
  for (let x = 12; x < width; x += 24) for (let y = 12; y < height; y += 24) if (r() < 0.16) dots.append(svg("rect", { x: x - 2.5, y: y - 2.5, width: 5, height: 5, rx: 1.2 }));
  root.append(dots);

  // Burbujas de opinión (siluetas, sin texto).
  const bubbles = svg("g", { class: "ra-bubbles" });
  for (let i = 0; i < 4; i++) {
    const w = 120 + r() * 70;
    const x = r() * (width - w);
    const y = r() * (height * 0.8);
    const g = svg("g", { transform: `translate(${x} ${y}) rotate(${-8 + r() * 16})`, class: "ra-bubble", style: `--d:${(i * 0.9).toFixed(1)}s` });
    g.append(
      svg("rect", { width: w, height: 46, rx: 14 }),
      svg("path", { d: `M18 46 l0 12 l14 -12 z` }),
      svg("rect", { x: 14, y: 14, width: w * 0.5, height: 6, rx: 3, class: "ra-line" }),
      svg("rect", { x: 14, y: 26, width: w * 0.7, height: 6, rx: 3, class: "ra-line" }),
    );
    bubbles.append(g);
  }
  root.append(bubbles);

  // Estrellas en tres profundidades.
  const stars = svg("g", { class: "ra-stars" });
  for (let i = 0; i < 16; i++) {
    const depth = r();
    const s = 0.6 + depth * 1.8;
    stars.append(svg("path", { d: STAR, transform: `translate(${(r() * width).toFixed(1)} ${(r() * height).toFixed(1)}) scale(${s.toFixed(2)}) rotate(${(-20 + r() * 40).toFixed(1)})`, class: `ra-star d${Math.min(2, Math.floor(depth * 3))}`, style: `--d:${(r() * 6).toFixed(1)}s` }));
  }
  root.append(stars);
  return root;
}
