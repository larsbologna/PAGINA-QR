// Mapa estilizado (decorativo): manzanas, calles, una avenida diagonal, un
// parque y un curso de agua. Se genera a partir del identificador del negocio,
// así cada negocio tiene "su" plano, siempre igual. No representa una ubicación real.
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

export function mapArt(seed, { width = 800, height = 360, cls = "map-art" } = {}) {
  const r = rng(seed);
  const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "xMidYMid slice", class: cls, "aria-hidden": "true", focusable: "false" });
  root.append(svg("rect", { width, height, class: "m-land" }));

  // Agua: una curva suave que cruza una esquina.
  const wy = height * (0.65 + r() * 0.2);
  root.append(svg("path", { class: "m-water", d: `M-20 ${wy} C ${width * 0.25} ${wy - 60 - r() * 40}, ${width * 0.45} ${wy + 50}, ${width * 0.7} ${height + 30} L -20 ${height + 30} Z` }));

  // Parque.
  const px = width * (0.62 + r() * 0.2);
  const py = height * (0.12 + r() * 0.2);
  root.append(svg("rect", { class: "m-park", x: px, y: py, width: 90 + r() * 50, height: 60 + r() * 40, rx: 14 }));

  // Calles en cuadrícula con anchos variables (algunas son avenidas).
  const g = svg("g", { class: "m-roads" });
  for (let x = -10 + r() * 40; x < width; x += 58 + r() * 34) g.append(svg("line", { x1: x, y1: 0, x2: x + (r() - 0.5) * 18, y2: height, "stroke-width": r() < 0.2 ? 9 : 4 }));
  for (let y = -10 + r() * 30; y < height; y += 46 + r() * 30) g.append(svg("line", { x1: 0, y1: y, x2: width, y2: y + (r() - 0.5) * 22, "stroke-width": r() < 0.2 ? 9 : 4 }));
  root.append(g);

  // Avenida diagonal con su línea de ruta.
  const ax = width * (0.1 + r() * 0.3);
  const d = `M${ax} ${height + 10} C ${ax + width * 0.2} ${height * 0.55}, ${ax + width * 0.35} ${height * 0.4}, ${width + 10} ${height * (0.05 + r() * 0.2)}`;
  root.append(svg("path", { class: "m-avenue", d }), svg("path", { class: "m-route", d }));

  // Curvas de nivel sutiles.
  const c = svg("g", { class: "m-contour" });
  const cx = width * (0.15 + r() * 0.2);
  const cy = height * (0.2 + r() * 0.2);
  for (let i = 1; i <= 4; i++) c.append(svg("ellipse", { cx, cy, rx: 30 * i + r() * 8, ry: 20 * i + r() * 6, transform: `rotate(${-15 + r() * 30} ${cx} ${cy})` }));
  root.append(c);
  return root;
}
