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

export function append(el, children) {
  for (const c of [children].flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function mount(root, ...children) {
  root.replaceChildren();
  append(root, children);
}

const NS = "http://www.w3.org/2000/svg";
export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  for (const c of children.flat()) if (c) el.append(c);
  return el;
}

// Iconos de trazo (24×24, 1.75 px), dibujados para ReseñaQR.
const ICONS = {
  pin: ["M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z", "M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  external: ["M14 4h6v6", "M20 4l-9 9", "M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  copy: ["M9 9h10v11H9z", "M5 15V4h10"],
  home: ["M4 11l8-6.5 8 6.5", "M6 9.5V20h12V9.5", "M10 20v-5h4v5"],
  chat: ["M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M8 10h8", "M8 13h5"],
  settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2 1.2l-.3 2h-4l-.3-2a7.6 7.6 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a7.5 7.5 0 0 1 0-3L2.6 9.3l2-3.4 1.9.7a7.6 7.6 0 0 1 2-1.2l.3-2h4l.3 2a7.6 7.6 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7.5 7.5 0 0 1 0 3z"],
  logout: ["M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3", "M10 16l-4-4 4-4", "M6 12h10"],
  upload: ["M12 16V4", "M7 9l5-5 5 5", "M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"],
  alert: ["M12 3l9.5 17h-19z", "M12 10v4", "M12 17h.01"],
  back: ["M15 5l-7 7 7 7"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  note: ["M5 4h10l4 4v12H5z", "M15 4v4h4", "M8 13h8", "M8 16h5"],
  inbox: ["M4 13l2.5-8h11L20 13", "M4 13v6h16v-6", "M4 13h4.5l1 2h5l1-2H20"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  sparkle: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M6 6l2.5 2.5", "M15.5 15.5L18 18", "M18 6l-2.5 2.5", "M8.5 15.5L6 18"],
  link: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  lock: ["M6 11h12v9H6z", "M8.5 11V8a3.5 3.5 0 0 1 7 0v3"],
  store: ["M4 9l1.5-5h13L20 9", "M4 9h16v1.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3 0z", "M5.5 12.5V20h13v-7.5", "M10 20v-4h4v4"],
  pen: ["M4 20h4L19 9l-4-4L4 16z", "M13.5 6.5l4 4"],
  starline: ["M12 3.5l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.8l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"],
  trend: ["M3 17l6-6 4 4 8-8", "M15 7h6v6"],
};

export function icon(name, size = 20, cls = "") {
  return svg(
    "svg",
    { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": 1.75, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: `icon ${cls}`.trim() },
    (ICONS[name] ?? []).map((d) => svg("path", { d })),
  );
}

const STAR_PATH = "M12 2.6l2.83 5.73 6.33.92-4.58 4.46 1.08 6.3L12 17.03l-5.66 2.98 1.08-6.3L2.84 9.25l6.33-.92z";

export function starIcon(filled, size = 24) {
  return svg("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", class: `star ${filled ? "on" : "off"}` }, svg("path", { d: STAR_PATH, "stroke-linejoin": "round" }));
}

export function starsRow(rating, size = 16) {
  return h("span", { class: "stars", role: "img", "aria-label": `${rating} de 5 estrellas` }, [1, 2, 3, 4, 5].map((i) => starIcon(i <= rating, size)));
}

export const fmtNum = (n, d = 0) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
export const fmtDateTime = (d) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
export const fmtDayShort = (d) => new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(d);
export const fmtMonth = (d) => new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit" }).format(d);

export function fmtRelative(d, now = Date.now()) {
  const s = Math.round((now - d.getTime()) / 1000);
  if (s < 60) return "recién";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const hr = Math.round(m / 60);
  if (hr < 24) return `hace ${hr} h`;
  const days = Math.round(hr / 24);
  if (days < 7) return days === 1 ? "ayer" : `hace ${days} días`;
  return fmtDayShort(d);
}

let toastHost;
export function toast(message, tone = "ok") {
  if (!toastHost) {
    toastHost = h("div", { class: "toast-host", role: "status", "aria-live": "polite" });
    document.body.append(toastHost);
  }
  const t = h("div", { class: `toast ${tone}` }, icon(tone === "ok" ? "check" : "alert", 18), h("span", {}, message));
  toastHost.append(t);
  setTimeout(() => {
    t.classList.add("out");
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

export function spinner(label = "Cargando") {
  return h("span", { class: "spinner", role: "progressbar", "aria-label": label });
}

export const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Iniciales sobre un fondo derivado del nombre (si el negocio no subió logo). */
export function logoEl(b, size = 64, cls = "") {
  if (b.logo) return h("img", { src: b.logo, alt: `Logo de ${b.name}`, width: size, height: size, class: `biz-logo ${cls}` });
  const initials = String(b.name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return h("span", { class: `biz-logo initials ${cls}`, "aria-hidden": "true", style: { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.36)}px` } }, initials);
}

/** URL pública estable del QR de un negocio, relativa a donde esté publicada la web. */
export function publicUrl(slug) {
  return `${location.origin}${location.pathname}?c=${encodeURIComponent(slug)}`;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Enlace copiado");
  } catch {
    toast("No se pudo copiar. Seleccioná el enlace y copialo a mano.", "err");
  }
}
