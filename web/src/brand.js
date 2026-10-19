// Marca centralizada de ReseñaQR. Para renombrar el producto o ajustar su
// identidad, se cambia solo este archivo (y los colores en styles.css → :root).
export const BRAND = {
  name: "ReseñaQR",
  // El logotipo se escribe en dos partes: la segunda va en el color de acento.
  wordmark: ["Reseña", "QR"],
  tagline: "Las opiniones de tus clientes, en un toque.",
};

const NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/**
 * Isotipo: el "ojo" de un código QR (cuadrado redondeado con borde) con una
 * estrella en el centro, sobre una burbuja de opinión.
 */
export function brandMark(size = 28) {
  const svg = svgEl("svg", { viewBox: "0 0 32 32", width: size, height: size, "aria-hidden": "true", class: "brand-mark" });
  svg.append(
    svgEl("path", { d: "M8 1h16a7 7 0 0 1 7 7v13a7 7 0 0 1-7 7h-7.2l-5.6 3.6c-.8.5-1.9-.1-1.9-1.1V28H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7z", fill: "var(--mark-body, #10203A)" }),
    svgEl("rect", { x: 6.2, y: 5.6, width: 19.6, height: 17.4, rx: 4.6, fill: "none", stroke: "var(--mark-ring, #fff)", "stroke-width": 2.2 }),
    svgEl("path", { d: "M16 8.6l1.85 3.75 4.15.6-3 2.92.7 4.12L16 18.05l-3.7 1.94.7-4.12-3-2.92 4.15-.6z", fill: "var(--mark-dot, #F5B000)" }),
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
  const [a, b] = BRAND.wordmark;
  word.append(a);
  if (b) {
    const s = document.createElement("span");
    s.className = "brand-word-accent";
    s.textContent = b;
    word.append(s);
  }
  wrap.append(brandMark(size), word);
  return wrap;
}
