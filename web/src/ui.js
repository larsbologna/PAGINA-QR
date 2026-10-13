// Utilidades de interfaz. Todo el texto se inserta con textContent (nunca HTML),
// así un comentario malicioso no puede inyectar código.

/** Crea un elemento: h("button", { class: "btn", onclick }, "Texto", otroNodo). */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else if (k === "checked") el.checked = !!v;
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function mount(root, ...children) {
  root.replaceChildren();
  append(root, children);
}

const STAR_PATH = "M12 2.5l2.95 6 6.55.95-4.75 4.6 1.1 6.5L12 17.5l-5.85 3.05 1.1-6.5L2.5 9.45l6.55-.95z";

/** Estrella SVG (sin HTML: se construye con createElementNS). */
export function starIcon(filled, size = 24) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("star", filled ? "on" : "off");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("d", STAR_PATH);
  svg.append(p);
  return svg;
}

export function starsRow(rating, size = 18) {
  return h("span", { class: "stars", role: "img", "aria-label": `${rating} de 5 estrellas` }, [1, 2, 3, 4, 5].map((i) => starIcon(i <= rating, size)));
}

export const RATING_LABELS = { 1: "Muy mala", 2: "Mala", 3: "Regular", 4: "Buena", 5: "Excelente" };
export const STATUS_LABELS = { NEW: "Nueva", IN_PROGRESS: "En seguimiento", REVIEWED: "Resuelta" };

export const fmtNum = (n, d = 0) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
export const fmtDateTime = (d) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

export function toast(message, tone = "ok") {
  const t = h("div", { class: `toast ${tone}`, role: "status" }, message);
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

/** Texto legible (blanco o casi negro) sobre el color de marca. */
export function textOn(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  if (Number.isNaN(n)) return "#fff";
  const ch = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#ffffff" : "#111827";
}

export function logoEl(b, size = 64) {
  if (b.logo) return h("img", { src: b.logo, alt: `Logo de ${b.name}`, width: size, height: size, class: "logo" });
  const initials = String(b.name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return h("div", { class: "logo initials", "aria-hidden": "true", style: { width: `${size}px`, height: `${size}px`, background: b.brandColor, color: textOn(b.brandColor), fontSize: `${size * 0.38}px` } }, initials);
}

/** URL pública estable del QR de un comercio, relativa a donde esté publicada la web. */
export function publicUrl(slug) {
  return `${location.origin}${location.pathname}?c=${encodeURIComponent(slug)}`;
}
