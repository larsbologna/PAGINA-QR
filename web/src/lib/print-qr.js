// Archivos para la imprenta: el QR de cada negocio (SVG vectorial y PNG) y una
// tarjeta lista para imprimir (PNG a 300 dpi, con 3 mm de sangrado).
// El QR usa corrección de errores alta (H), por eso admite el logo en el centro.
import QRCode from "qrcode";

const QUIET = 4; // margen blanco obligatorio alrededor del QR, en módulos
const INK = "#10203A";
const STAR = "#F5B000";
const MUTED = "#5D6B82";

function matrix(url) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "H" });
  return { n: modules.size, dark: (r, c) => modules.get(r, c) };
}

/** ¿El módulo (r, c) pertenece a uno de los tres "ojos" del QR? */
const inFinder = (n, r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
const finders = (n) => [
  [0, 0],
  [0, n - 7],
  [n - 7, 0],
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starPath(ctx, cx, cy, R) {
  const r = R * 0.48;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
}

/** Isotipo de ReseñaQR (estrella sobre fondo tinta) para el centro del QR si el negocio no tiene logo. */
function drawMark(ctx, x, y, s) {
  ctx.fillStyle = INK;
  roundRect(ctx, x, y, s, s, s * 0.24);
  ctx.fill();
  ctx.fillStyle = STAR;
  starPath(ctx, x + s / 2, y + s / 2 + s * 0.03, s * 0.34);
  ctx.fill();
}

/** Dibuja el QR (con su margen blanco) en un cuadrado de `size` px. */
async function drawQr(ctx, url, x, y, size, logo) {
  const { n, dark } = matrix(url);
  const u = size / (n + QUIET * 2);
  const ox = x + QUIET * u;
  const oy = y + QUIET * u;
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = INK;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!dark(r, c) || inFinder(n, r, c)) continue;
      roundRect(ctx, ox + c * u + u * 0.04, oy + r * u + u * 0.04, u * 0.92, u * 0.92, u * 0.28);
      ctx.fill();
    }
  }
  // Ojos con esquinas redondeadas (la firma visual de la marca).
  for (const [r, c] of finders(n)) {
    const fx = ox + c * u;
    const fy = oy + r * u;
    ctx.fillStyle = INK;
    roundRect(ctx, fx, fy, 7 * u, 7 * u, 2 * u);
    ctx.fill();
    ctx.fillStyle = "#fff";
    roundRect(ctx, fx + u, fy + u, 5 * u, 5 * u, 1.4 * u);
    ctx.fill();
    ctx.fillStyle = INK;
    roundRect(ctx, fx + 2 * u, fy + 2 * u, 3 * u, 3 * u, 0.9 * u);
    ctx.fill();
  }
  // Logo al centro, sobre un recuadro blanco (≈ 22 % del ancho).
  const box = Math.round((n * 0.22) | 1) * u;
  const bx = x + size / 2 - box / 2;
  const by = y + size / 2 - box / 2;
  ctx.fillStyle = "#fff";
  roundRect(ctx, bx - u * 0.6, by - u * 0.6, box + u * 1.2, box + u * 1.2, u * 1.6);
  ctx.fill();
  if (logo) {
    ctx.save();
    roundRect(ctx, bx, by, box, box, u * 1.3);
    ctx.clip();
    const s = Math.min(box / logo.width, box / logo.height);
    ctx.drawImage(logo, bx + (box - logo.width * s) / 2, by + (box - logo.height * s) / 2, logo.width * s, logo.height * s);
    ctx.restore();
  } else {
    drawMark(ctx, bx, by, box);
  }
}

/** QR vectorial (SVG): ideal para la imprenta porque no pierde calidad al agrandarlo. */
export function qrSvg(url, logoDataUrl) {
  const { n, dark } = matrix(url);
  const S = n + QUIET * 2;
  const q = (v) => +(v + QUIET).toFixed(2);
  let mods = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c) && !inFinder(n, r, c)) mods += `<rect x="${q(c + 0.04)}" y="${q(r + 0.04)}" width="0.92" height="0.92" rx="0.28"/>`;
  let eyes = "";
  for (const [r, c] of finders(n)) {
    eyes += `<rect x="${q(c)}" y="${q(r)}" width="7" height="7" rx="2" fill="${INK}"/><rect x="${q(c + 1)}" y="${q(r + 1)}" width="5" height="5" rx="1.4" fill="#fff"/><rect x="${q(c + 2)}" y="${q(r + 2)}" width="3" height="3" rx="0.9" fill="${INK}"/>`;
  }
  const box = Math.round((n * 0.22) | 1);
  const b = S / 2 - box / 2;
  const center = logoDataUrl
    ? `<clipPath id="l"><rect x="${b}" y="${b}" width="${box}" height="${box}" rx="1.3"/></clipPath><image href="${logoDataUrl}" x="${b}" y="${b}" width="${box}" height="${box}" preserveAspectRatio="xMidYMid meet" clip-path="url(#l)"/>`
    : `<rect x="${b}" y="${b}" width="${box}" height="${box}" rx="${box * 0.24}" fill="${INK}"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S * 10}" height="${S * 10}" shape-rendering="geometricPrecision">
<rect width="${S}" height="${S}" fill="#fff"/>
<g fill="${INK}">${mods}</g>${eyes}
<rect x="${b - 0.6}" y="${b - 0.6}" width="${box + 1.2}" height="${box + 1.2}" rx="1.6" fill="#fff"/>${center}
</svg>`;
}

/** QR en PNG de alta resolución. */
export async function qrPng(url, logoDataUrl, size = 2000) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const logo = logoDataUrl ? await loadImage(logoDataUrl).catch(() => null) : null;
  await drawQr(canvas.getContext("2d"), url, 0, 0, size, logo);
  return canvas;
}

function fitText(ctx, text, maxWidth, size, weight, family) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    s -= 2;
  } while (s > 18);
  return s;
}

const MM = 300 / 25.4; // píxeles por milímetro a 300 dpi
export const CARD = { widthMm: 85.6, heightMm: 54, bleedMm: 3 };

/**
 * Tarjeta lista para imprenta, tamaño tarjeta de crédito (85,6 × 54 mm) más
 * 3 mm de sangrado por lado, a 300 dpi. Lo importante queda a 3 mm del corte.
 */
export async function cardPng(business, url) {
  const W = Math.round((CARD.widthMm + CARD.bleedMm * 2) * MM);
  const H = Math.round((CARD.heightMm + CARD.bleedMm * 2) * MM);
  const safe = Math.round((CARD.bleedMm + 3.5) * MM);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  await Promise.all([document.fonts?.load("700 48px Bricolage"), document.fonts?.load("500 24px Geist"), document.fonts?.load("600 24px Geist")].filter(Boolean)).catch(() => undefined);
  const logo = business.logo ? await loadImage(business.logo).catch(() => null) : null;

  // Fondo: blanco con un toque cálido en la esquina (se extiende al sangrado).
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.08, H * 1.05, 0, W * 0.08, H * 1.05, W * 0.55);
  g.addColorStop(0, "rgba(245,176,0,0.16)");
  g.addColorStop(1, "rgba(245,176,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // QR a la derecha.
  const qrSize = H - safe * 2 + Math.round(4 * MM);
  const qx = W - safe - qrSize + Math.round(2 * MM);
  const qy = (H - qrSize) / 2;
  ctx.save();
  ctx.shadowColor = "rgba(16,32,58,0.12)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#fff";
  roundRect(ctx, qx, qy, qrSize, qrSize, 28);
  ctx.fill();
  ctx.restore();
  await drawQr(ctx, url, qx + 6, qy + 6, qrSize - 12, logo);

  // Columna izquierda.
  const left = safe;
  const colW = qx - left - Math.round(5 * MM);
  let y = safe;
  const logoSize = Math.round(12 * MM);
  if (logo) {
    ctx.save();
    roundRect(ctx, left, y, logoSize, logoSize, 22);
    ctx.clip();
    ctx.fillStyle = "#fff";
    ctx.fillRect(left, y, logoSize, logoSize);
    const s = Math.min(logoSize / logo.width, logoSize / logo.height);
    ctx.drawImage(logo, left + (logoSize - logo.width * s) / 2, y + (logoSize - logo.height * s) / 2, logo.width * s, logo.height * s);
    ctx.restore();
    y += logoSize + Math.round(2.5 * MM);
  }
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  const nameSize = fitText(ctx, business.name, colW, 58, 700, "Bricolage, sans-serif");
  y += nameSize;
  ctx.fillText(business.name, left, y);

  y += Math.round(3.6 * MM);
  ctx.fillStyle = INK;
  const qSize = fitText(ctx, "¿Cómo fue tu experiencia?", colW, 40, 600, "Geist, sans-serif");
  y += qSize;
  ctx.fillText("¿Cómo fue tu experiencia?", left, y);

  // Cinco estrellas.
  y += Math.round(2.4 * MM);
  const starR = Math.min(26, colW / 11);
  ctx.fillStyle = STAR;
  for (let i = 0; i < 5; i++) {
    starPath(ctx, left + starR + i * starR * 2.25, y + starR, starR);
    ctx.fill();
  }
  y += starR * 2 + Math.round(2.6 * MM);

  ctx.fillStyle = MUTED;
  fitText(ctx, "Escaneá el código y dejanos tu opinión", colW, 27, 500, "Geist, sans-serif");
  ctx.fillText("Escaneá el código y dejanos tu opinión", left, y + 20);

  // Pie: marca de ReseñaQR.
  const fy = H - safe;
  drawMark(ctx, left, fy - 30, 30);
  ctx.fillStyle = MUTED;
  ctx.font = "600 21px Geist, sans-serif";
  ctx.fillText("ReseñaQR", left + 40, fy - 8);
  return canvas;
}

/** Descarga un canvas como PNG o un texto como archivo. */
export async function download(data, filename, type) {
  const blob = data instanceof HTMLCanvasElement ? await new Promise((res) => data.toBlob(res, "image/png")) : new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
