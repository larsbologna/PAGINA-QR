"use client";
// Biblioteca de íconos (Lucide + Tabler, más de 8000 íconos de línea, licencias ISC/MIT).
// Los paquetes se cargan recién cuando se buscan íconos, para no pesar en la carga inicial.
// En el proyecto se guarda el SVG del ícono elegido, así el slide se dibuja y se exporta
// sin depender de volver a cargar la biblioteca.

import { getIconData, iconToSVG } from "@iconify/utils";
import type { IconifyJSON } from "@iconify/types";
import { sanitizeSvgFragment } from "./sanitize";

export const ICON_SETS = {
  lucide: { label: "Lucide", load: () => import("@iconify-json/lucide/icons.json").then((m) => (m.default ?? m) as unknown as IconifyJSON) },
  tabler: { label: "Tabler", load: () => import("@iconify-json/tabler/icons.json").then((m) => (m.default ?? m) as unknown as IconifyJSON) },
} as const;

export type IconSetId = keyof typeof ICON_SETS;

const cache = new Map<IconSetId, Promise<IconifyJSON>>();

function loadSet(id: IconSetId): Promise<IconifyJSON> {
  let p = cache.get(id);
  if (!p) {
    p = ICON_SETS[id].load();
    cache.set(id, p);
  }
  return p;
}

/** Valor guardado en el proyecto: nombre + SVG del ícono. */
export interface IconValue {
  n: string;
  v: string;
  b: string;
}

export function encodeIcon(icon: IconValue): string {
  return JSON.stringify(icon);
}

/** Un ícono guardado, o un emoji / texto corto si el valor no es un ícono. */
export function decodeIcon(value: string | undefined): IconValue | { emoji: string } | null {
  if (!value) return null;
  if (value.startsWith("{")) {
    try {
      const o = JSON.parse(value) as Partial<IconValue>;
      if (typeof o.b === "string" && typeof o.v === "string") return { n: String(o.n ?? ""), v: o.v, b: sanitizeSvgFragment(o.b) };
    } catch {
      return null;
    }
    return null;
  }
  return { emoji: value.slice(0, 4) };
}

export async function iconValue(set: IconSetId, name: string): Promise<string | null> {
  const data = getIconData(await loadSet(set), name);
  if (!data) return null;
  const svg = iconToSVG(data);
  return encodeIcon({ n: `${set}:${name}`, v: svg.attributes.viewBox, b: svg.body });
}

// Búsqueda: los nombres de los íconos están en inglés; traducimos las palabras más usadas.
const ES: Record<string, string[]> = {
  casa: ["home", "house"], hogar: ["home"], negocio: ["building-store", "store", "briefcase"], tienda: ["store", "shopping"],
  local: ["store", "building"], dinero: ["cash", "coin", "money", "wallet"], plata: ["cash", "coin", "money"], pago: ["credit-card", "cash"],
  venta: ["shopping", "receipt", "tag"], ventas: ["chart", "shopping", "trending"], cliente: ["user", "users"], clientes: ["users"],
  persona: ["user"], personas: ["users"], gente: ["users"], equipo: ["users-group", "users"], usuario: ["user"],
  corazon: ["heart"], amor: ["heart"], estrella: ["star"], estrellas: ["star"], resena: ["star", "message"], reseña: ["star", "message"],
  mensaje: ["message", "mail"], chat: ["message"], correo: ["mail"], email: ["mail"], telefono: ["phone", "device-mobile"],
  teléfono: ["phone", "device-mobile"], celular: ["device-mobile", "smartphone"], computadora: ["device-desktop", "laptop", "monitor"],
  mapa: ["map"], ubicacion: ["map-pin"], ubicación: ["map-pin"], pin: ["map-pin"], buscar: ["search"], busqueda: ["search"],
  búsqueda: ["search"], idea: ["bulb", "lightbulb"], foco: ["bulb", "focus", "target"], objetivo: ["target"], meta: ["target", "flag", "trophy"],
  exito: ["trophy", "award"], éxito: ["trophy", "award"], premio: ["trophy", "award"], crecimiento: ["trending-up", "plant", "sprout"],
  crecer: ["trending-up", "plant"], grafico: ["chart"], gráfico: ["chart"], estadistica: ["chart"], estadística: ["chart"],
  tiempo: ["clock", "hourglass"], reloj: ["clock"], calendario: ["calendar"], fecha: ["calendar"], dia: ["sun", "calendar"],
  día: ["sun", "calendar"], noche: ["moon"], sol: ["sun"], luna: ["moon"], cohete: ["rocket"], lanzamiento: ["rocket"],
  rayo: ["bolt", "zap"], energia: ["bolt", "battery", "zap"], energía: ["bolt", "battery", "zap"], fuego: ["flame"],
  motivacion: ["flame", "rocket", "bolt"], motivación: ["flame", "rocket", "bolt"], mente: ["brain"], cerebro: ["brain"],
  pensar: ["brain", "bulb"], libro: ["book"], leer: ["book"], estudio: ["school", "book"], aprender: ["school", "book"],
  escuela: ["school"], trabajo: ["briefcase"], oficina: ["building", "briefcase"], herramienta: ["tool", "wrench"],
  configuracion: ["settings"], configuración: ["settings"], check: ["check", "circle-check"], ok: ["check"], bien: ["check", "thumb-up"],
  mal: ["x", "thumb-down"], error: ["alert", "x"], alerta: ["alert"], advertencia: ["alert"], cruz: ["x"], flecha: ["arrow"],
  subir: ["arrow-up", "trending-up"], bajar: ["arrow-down", "trending-down"], camara: ["camera"], cámara: ["camera"], foto: ["photo", "camera"],
  video: ["video"], musica: ["music"], música: ["music"], comida: ["tools-kitchen", "pizza", "chef"], pizza: ["pizza"], cafe: ["coffee"],
  café: ["coffee"], salud: ["heart", "stethoscope", "activity"], ejercicio: ["barbell", "run", "activity"], deporte: ["ball", "run"],
  correr: ["run"], agua: ["droplet"], planta: ["plant"], naturaleza: ["leaf", "tree"], arbol: ["tree"], árbol: ["tree"],
  viaje: ["plane", "luggage"], avion: ["plane"], avión: ["plane"], auto: ["car"], casa2: ["building"], regalo: ["gift"],
  carrito: ["shopping-cart"], compras: ["shopping-cart", "shopping-bag"], etiqueta: ["tag"], descuento: ["discount", "percentage"],
  porcentaje: ["percentage"], candado: ["lock"], seguridad: ["shield", "lock"], escudo: ["shield"], llave: ["key"],
  link: ["link"], enlace: ["link"], qr: ["qrcode"], codigo: ["code", "qrcode"], código: ["code", "qrcode"], instagram: ["brand-instagram"],
  whatsapp: ["brand-whatsapp"], facebook: ["brand-facebook"], tiktok: ["brand-tiktok"], youtube: ["brand-youtube"], google: ["brand-google"],
  linkedin: ["brand-linkedin"], twitter: ["brand-x", "brand-twitter"], mundo: ["world", "globe"], web: ["world", "browser"],
  pagina: ["browser", "file"], página: ["browser", "file"], documento: ["file"], archivo: ["file", "folder"], carpeta: ["folder"],
  nube: ["cloud"], descarga: ["download"], compartir: ["share"], guardar: ["bookmark", "device-floppy"], marcador: ["bookmark"],
  me: ["thumb-up"], gusta: ["thumb-up", "heart"], like: ["thumb-up", "heart"], comentario: ["message"], notificacion: ["bell"],
  notificación: ["bell"], campana: ["bell"], sonrisa: ["mood-smile", "smile"], feliz: ["mood-smile", "smile"], triste: ["mood-sad"],
  calma: ["leaf", "wind"], paz: ["peace", "leaf"], habito: ["repeat", "calendar-check"], hábito: ["repeat", "calendar-check"],
  rutina: ["repeat", "list-check"], lista: ["list", "list-check"], tarea: ["checkbox", "list-check"], tareas: ["list-check"],
  paso: ["stairs", "footprints"], pasos: ["stairs"], escalera: ["stairs"], camino: ["route", "road"], proceso: ["route", "arrows-right"],
  inicio: ["flag", "player-play"], fin: ["flag"], bandera: ["flag"], diamante: ["diamond"], corona: ["crown"], llama: ["flame"],
  balanza: ["scale"], equilibrio: ["scale"], candado2: ["lock"], ojo: ["eye"], ver: ["eye"], mano: ["hand"], apreton: ["handshake"],
  acuerdo: ["handshake"], mascota: ["paw", "dog", "cat"], perro: ["dog"], gato: ["cat"], bebe: ["baby"], familia: ["users"],
  arte: ["palette", "brush"], diseño: ["palette", "brush"], color: ["palette"], escribir: ["pencil", "edit"], lapiz: ["pencil"],
  lápiz: ["pencil"], microfono: ["microphone"], micrófono: ["microphone"], podcast: ["microphone"], megafono: ["speakerphone"],
  megáfono: ["speakerphone"], anuncio: ["speakerphone"], publicidad: ["speakerphone", "ad"], rapido: ["bolt", "rocket"], rápido: ["bolt"],
  lento: ["hourglass"], espera: ["hourglass"], pregunta: ["help", "question-mark"], ayuda: ["help", "lifebuoy"], info: ["info-circle"],
  medalla: ["medal"], numero: ["number", "hash"], número: ["number", "hash"], ia: ["sparkles", "robot"], robot: ["robot"],
  magia: ["sparkles", "wand"], brillo: ["sparkles"],
};

export interface IconHit {
  set: IconSetId;
  name: string;
}

let index: IconHit[] | null = null;

async function allIcons(): Promise<IconHit[]> {
  if (index) return index;
  const out: IconHit[] = [];
  for (const id of Object.keys(ICON_SETS) as IconSetId[]) {
    const set = await loadSet(id);
    for (const name of Object.keys(set.icons)) out.push({ set: id, name });
  }
  index = out;
  return out;
}

export async function searchIcons(query: string, limit = 120): Promise<IconHit[]> {
  const icons = await allIcons();
  const words = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return icons.filter((i) => i.set === "lucide").slice(0, limit);
  const terms = words.flatMap((w) => [w, ...(ES[w] ?? ES[w.normalize("NFD").replace(/[̀-ͯ]/g, "")] ?? [])]);
  const scored: { hit: IconHit; score: number }[] = [];
  for (const hit of icons) {
    let score = 0;
    for (const t of terms) {
      if (hit.name === t) score += 10;
      else if (hit.name.startsWith(t + "-") || hit.name.endsWith("-" + t)) score += 6;
      else if (hit.name.includes(t)) score += 3;
    }
    if (score) scored.push({ hit, score: score - hit.name.length * 0.02 + (hit.set === "lucide" ? 0.5 : 0) });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.hit);
}

/** SVG de un ícono para mostrarlo en el buscador (sin guardarlo). */
export async function iconPreview(hit: IconHit): Promise<{ viewBox: string; body: string } | null> {
  const data = getIconData(await loadSet(hit.set), hit.name);
  if (!data) return null;
  const svg = iconToSVG(data);
  return { viewBox: svg.attributes.viewBox, body: svg.body };
}
