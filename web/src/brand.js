// Marca centralizada de Pagina-QR. Para renombrar el producto o ajustar su
// identidad, se cambia solo este archivo (y los colores en styles.css → :root).
export const BRAND = {
  name: "Pagina-QR",
  tagline: "Opiniones de tus clientes, directo desde el QR.",
  // Colores principales (se repiten como variables CSS en styles.css).
  ink: "#0D1B2A",
  primary: "#0F7B5F",
  pin: "#F2542D",
};

const NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/**
 * Isotipo: un pin de mapa cuya cabeza es el "ojo" de un código QR
 * (cuadrado de esquinas redondeadas con un punto central).
 */
export function brandMark(size = 28) {
  const svg = svgEl("svg", { viewBox: "0 0 32 32", width: size, height: size, "aria-hidden": "true", class: "brand-mark" });
  svg.append(
    svgEl("path", { d: "M16 31c-.5 0-1-.2-1.3-.6L8.4 23H8a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-.4l-6.3 7.4c-.3.4-.8.6-1.3.6z", fill: "var(--mark-body, #0D1B2A)" }),
    svgEl("rect", { x: 8, y: 5, width: 16, height: 14, rx: 3.5, fill: "none", stroke: "var(--mark-ring, #fff)", "stroke-width": 2.6 }),
    svgEl("rect", { x: 12.6, y: 9.1, width: 6.8, height: 5.8, rx: 1.4, fill: "var(--mark-dot, #F2542D)" }),
  );
  return svg;
}

/** Logo completo (isotipo + nombre). */
export function brandLogo({ size = 26, href } = {}) {
  const wrap = document.createElement(href ? "a" : "span");
  wrap.className = "brand-logo";
  if (href) {
    wrap.href = href;
    wrap.setAttribute("aria-label", `${BRAND.name} — inicio`);
  }
  const word = document.createElement("span");
  word.className = "brand-word";
  const [a, b] = BRAND.name.split("-");
  word.append(a ?? BRAND.name);
  if (b) {
    const s = document.createElement("span");
    s.className = "brand-word-accent";
    s.textContent = b;
    word.append(s);
  }
  wrap.append(brandMark(size), word);
  return wrap;
}
