import type { ImageStyle, SlideRole, Visual, VisualKind } from "./types";
import { DEFAULT_ICONS } from "./defaultIcons";

// Catálogo de visuales: qué textos editables tiene cada uno y sus valores iniciales.
// La parte gráfica de cada visual está en components/visuals.

export interface VisualField {
  key: string;
  label: string;
  multiline?: boolean;
  /** icon: buscador de íconos · items: lista de tarjetas · select: opciones fijas · svg: dibujo propio. */
  type?: "icon" | "items" | "select" | "svg";
  options?: { value: string; label: string }[];
  hint?: string;
}

export const VISUAL_GROUPS = [
  "Personalizados",
  "Datos y gráficos",
  "Diagramas",
  "Listas y comparaciones",
  "Interfaces y mockups",
  "Imágenes",
  "Google Maps",
] as const;

export type VisualGroup = (typeof VISUAL_GROUPS)[number];

/** Ítem del visual "Bloques": ícono + título + texto. Se guarda como JSON en props.items. */
export interface BlockItem {
  icon: string;
  title: string;
  text: string;
}

export function parseItems(value: string | undefined): BlockItem[] {
  try {
    const arr = JSON.parse(value ?? "[]");
    return Array.isArray(arr)
      ? arr.slice(0, 8).map((x) => ({ icon: String(x?.icon ?? ""), title: String(x?.title ?? ""), text: String(x?.text ?? "") }))
      : [];
  } catch {
    return [];
  }
}

const I = DEFAULT_ICONS;
const items = (list: [string, string, string][]) => JSON.stringify(list.map(([icon, title, text]) => ({ icon, title, text })));

export interface VisualSpec {
  label: string;
  group: VisualGroup;
  fields: VisualField[];
  defaults: Record<string, string>;
  /** Necesita una imagen subida para lucirse. */
  usesImage?: boolean;
}

export const VISUALS: Record<VisualKind, VisualSpec> = {
  none: { label: "Sin visual", group: "Personalizados", fields: [], defaults: {} },
  photo: {
    label: "Fotografía integrada",
    group: "Imágenes",
    usesImage: true,
    fields: [{ key: "caption", label: "Epígrafe" }],
    defaults: { caption: "" },
  },
  phone: {
    label: "Mockup de teléfono",
    group: "Interfaces y mockups",
    usesImage: true,
    fields: [
      { key: "app", label: "Nombre en pantalla" },
      { key: "line1", label: "Línea 1" },
      { key: "line2", label: "Línea 2" },
      { key: "line3", label: "Línea 3" },
    ],
    defaults: { app: "Tu negocio", line1: "Abierto ahora", line2: "Reservas y pedidos", line3: "Cómo llegar" },
  },
  stats: {
    label: "Gráfico de barras",
    group: "Datos y gráficos",
    fields: [
      { key: "title", label: "Título del gráfico" },
      { key: "labels", label: "Etiquetas (separadas por coma)" },
      { key: "values", label: "Valores (separados por coma)" },
      { key: "note", label: "Nota" },
    ],
    defaults: { title: "Evolución", labels: "Ene, Feb, Mar, Abr, May", values: "20, 32, 41, 58, 76", note: "Datos ilustrativos" },
  },
  steps: {
    label: "Diagrama de pasos",
    group: "Diagramas",
    fields: [
      { key: "s1", label: "Paso 1" },
      { key: "s2", label: "Paso 2" },
      { key: "s3", label: "Paso 3" },
      { key: "s4", label: "Paso 4 (opcional)" },
    ],
    defaults: { s1: "Primer paso", s2: "Segundo paso", s3: "Resultado", s4: "" },
  },
  comparison: {
    label: "Comparativa",
    group: "Listas y comparaciones",
    fields: [
      { key: "leftTitle", label: "Título izquierda" },
      { key: "left", label: "Puntos izquierda (uno por línea)", multiline: true },
      { key: "rightTitle", label: "Título derecha" },
      { key: "right", label: "Puntos derecha (uno por línea)", multiline: true },
    ],
    defaults: {
      leftTitle: "Hoy",
      left: "Depende del boca en boca\nNadie te encuentra\nPoca confianza",
      rightTitle: "Con un sistema",
      right: "Te recomiendan solos\nAparecés cuando te buscan\nGenerás confianza",
    },
  },
  checklist: {
    label: "Lista con checks",
    group: "Listas y comparaciones",
    fields: [{ key: "items", label: "Ítems (uno por línea)", multiline: true }],
    defaults: { items: "Primer punto\nSegundo punto\nTercer punto" },
  },
  quote: {
    label: "Cita destacada",
    group: "Listas y comparaciones",
    fields: [
      { key: "text", label: "Cita", multiline: true },
      { key: "author", label: "Autor" },
    ],
    defaults: { text: "La mejor publicidad es un cliente conforme.", author: "" },
  },
  qr: {
    label: "Código QR",
    group: "Interfaces y mockups",
    fields: [
      { key: "label", label: "Texto junto al QR" },
      { key: "seed", label: "Enlace que abre el QR (escaneable)" },
    ],
    defaults: { label: "Escaneá y dejanos tu opinión", seed: "https://ejemplo.com" },
  },
  chat: {
    label: "Conversación de chat",
    group: "Interfaces y mockups",
    fields: [
      { key: "name", label: "Nombre del contacto" },
      { key: "m1", label: "Mensaje del negocio", multiline: true },
      { key: "m2", label: "Respuesta del cliente", multiline: true },
      { key: "m3", label: "Mensaje final (opcional)", multiline: true },
    ],
    defaults: { name: "Cliente", m1: "¡Hola! ¿Cómo te fue con tu pedido?", m2: "¡Re bien, gracias!", m3: "" },
  },
  review: {
    label: "Tarjeta de reseña",
    group: "Interfaces y mockups",
    fields: [
      { key: "author", label: "Autor" },
      { key: "stars", label: "Estrellas (1 a 5)" },
      { key: "text", label: "Texto", multiline: true },
    ],
    defaults: { author: "Laura M.", stars: "5", text: "Atención impecable y todo riquísimo. Volvemos seguro." },
  },
  "cta-button": {
    label: "Botón de llamada a la acción",
    group: "Interfaces y mockups",
    fields: [
      { key: "label", label: "Texto del botón" },
      { key: "handle", label: "Usuario o contacto" },
    ],
    defaults: { label: "Escribime", handle: "" },
  },
  blocks: {
    label: "Bloques con íconos (armalo vos)",
    group: "Personalizados",
    fields: [
      { key: "items", label: "Bloques", type: "items" },
      {
        key: "layout",
        label: "Disposición",
        type: "select",
        options: [
          { value: "grid2", label: "Grilla de 2 columnas" },
          { value: "grid3", label: "Grilla de 3 columnas" },
          { value: "row", label: "En fila" },
          { value: "column", label: "En columna" },
          { value: "hero", label: "Uno grande y el resto en lista" },
        ],
      },
      {
        key: "style",
        label: "Estilo",
        type: "select",
        options: [
          { value: "cards", label: "Tarjetas" },
          { value: "outline", label: "Contorno" },
          { value: "circles", label: "Íconos en círculo, sin tarjeta" },
          { value: "plain", label: "Solo ícono y texto" },
        ],
      },
      {
        key: "connector",
        label: "Conexión entre bloques",
        type: "select",
        options: [
          { value: "none", label: "Ninguna" },
          { value: "arrows", label: "Flechas" },
          { value: "numbers", label: "Numerados" },
        ],
      },
    ],
    defaults: {
      items: items([
        [I.target, "Claridad", "Sabés a dónde vas"],
        [I.flame, "Constancia", "Un poco todos los días"],
        [I["trending-up"], "Progreso", "Medís y ajustás"],
        [I.trophy, "Resultado", "Llega solo"],
      ]),
      layout: "grid2",
      style: "cards",
      connector: "none",
    },
  },
  "icon-hero": {
    label: "Ícono grande",
    group: "Personalizados",
    fields: [
      { key: "icon", label: "Ícono", type: "icon" },
      { key: "caption", label: "Texto debajo (opcional)" },
      {
        key: "shape",
        label: "Forma",
        type: "select",
        options: [
          { value: "circle", label: "Círculo" },
          { value: "square", label: "Cuadrado redondeado" },
          { value: "plain", label: "Sin fondo" },
        ],
      },
    ],
    defaults: { icon: I.rocket, caption: "", shape: "circle" },
  },
  svg: {
    label: "Dibujo propio (IA o SVG)",
    group: "Personalizados",
    fields: [{ key: "svg", label: "Dibujo", type: "svg" }],
    defaults: { svg: "" },
  },
  "big-number": {
    label: "Número destacado",
    group: "Datos y gráficos",
    fields: [
      { key: "value", label: "Número o dato" },
      { key: "label", label: "Qué significa" },
      { key: "note", label: "Nota o fuente" },
    ],
    defaults: { value: "21 días", label: "para que un hábito empiece a sentirse natural", note: "Referencia orientativa: varía según la persona" },
  },
  progress: {
    label: "Barras de progreso",
    group: "Datos y gráficos",
    fields: [
      { key: "items", label: "Barras (una por línea: Nombre: porcentaje)", multiline: true },
      { key: "note", label: "Nota" },
    ],
    defaults: { items: "Constancia: 80\nFoco: 60\nDescanso: 45", note: "Ejemplo ilustrativo" },
  },
  donut: {
    label: "Gráfico de torta",
    group: "Datos y gráficos",
    fields: [
      { key: "items", label: "Partes (una por línea: Nombre: valor)", multiline: true },
      { key: "center", label: "Texto del centro" },
    ],
    defaults: { items: "Lo urgente: 65\nLo importante: 35", center: "Tu semana" },
  },
  "line-chart": {
    label: "Gráfico de líneas",
    group: "Datos y gráficos",
    fields: [
      { key: "title", label: "Título" },
      { key: "labels", label: "Etiquetas (separadas por coma)" },
      { key: "values", label: "Valores (separados por coma)" },
      { key: "note", label: "Nota" },
    ],
    defaults: { title: "Tu avance", labels: "S1, S2, S3, S4, S5, S6", values: "10, 14, 13, 22, 28, 35", note: "Datos ilustrativos" },
  },
  "habit-tracker": {
    label: "Seguimiento de hábito",
    group: "Datos y gráficos",
    fields: [
      { key: "habit", label: "Hábito" },
      { key: "done", label: "Días cumplidos" },
      { key: "total", label: "Días totales (7 a 35)" },
    ],
    defaults: { habit: "Leer 10 minutos", done: "18", total: "28" },
  },
  timeline: {
    label: "Línea de tiempo",
    group: "Diagramas",
    fields: [{ key: "items", label: "Hitos (uno por línea: Momento: descripción)", multiline: true }],
    defaults: { items: "Mes 1: Empecé sin plan\nMes 3: Primer resultado\nMes 6: Rutina que se sostiene" },
  },
  pyramid: {
    label: "Pirámide",
    group: "Diagramas",
    fields: [{ key: "items", label: "Niveles de arriba hacia abajo (uno por línea)", multiline: true }],
    defaults: { items: "Resultados\nHábitos\nIdentidad" },
  },
  funnel: {
    label: "Embudo",
    group: "Diagramas",
    fields: [{ key: "items", label: "Etapas de arriba hacia abajo (una por línea)", multiline: true }],
    defaults: { items: "Te ven\nTe siguen\nTe escriben\nTe eligen" },
  },
  matrix: {
    label: "Matriz 2×2",
    group: "Diagramas",
    fields: [
      { key: "xLabel", label: "Eje horizontal" },
      { key: "yLabel", label: "Eje vertical" },
      { key: "tl", label: "Arriba a la izquierda" },
      { key: "tr", label: "Arriba a la derecha" },
      { key: "bl", label: "Abajo a la izquierda" },
      { key: "br", label: "Abajo a la derecha" },
    ],
    defaults: { xLabel: "Urgencia →", yLabel: "Importancia →", tl: "Planificalo", tr: "Hacelo ya", bl: "Eliminalo", br: "Delegalo" },
  },
  cycle: {
    label: "Ciclo",
    group: "Diagramas",
    fields: [
      { key: "items", label: "Etapas (una por línea, 3 a 6)", multiline: true },
      { key: "center", label: "Centro (opcional)" },
    ],
    defaults: { items: "Hacer\nMedir\nAprender\nAjustar", center: "Mejora continua" },
  },
  venn: {
    label: "Diagrama de Venn",
    group: "Diagramas",
    fields: [
      { key: "a", label: "Círculo izquierdo" },
      { key: "b", label: "Círculo derecho" },
      { key: "center", label: "Intersección" },
    ],
    defaults: { a: "Lo que te gusta", b: "Lo que sabés hacer", center: "Tu foco" },
  },
  "do-dont": {
    label: "Sí / No",
    group: "Listas y comparaciones",
    fields: [
      { key: "doTitle", label: "Título de lo que sí" },
      { key: "do", label: "Lo que sí (uno por línea)", multiline: true },
      { key: "dontTitle", label: "Título de lo que no" },
      { key: "dont", label: "Lo que no (uno por línea)", multiline: true },
    ],
    defaults: { doTitle: "Hacé", do: "Empezá chico\nRepetí todos los días\nMedí tu avance", dontTitle: "Evitá", dont: "Esperar ganas\nCambiar todo junto\nCompararte" },
  },
  "myth-fact": {
    label: "Mito vs. realidad",
    group: "Listas y comparaciones",
    fields: [
      { key: "myth", label: "Mito", multiline: true },
      { key: "fact", label: "Realidad", multiline: true },
    ],
    defaults: { myth: "Necesitás motivación para empezar.", fact: "La motivación suele aparecer después de empezar." },
  },
  table: {
    label: "Tabla",
    group: "Listas y comparaciones",
    fields: [{ key: "rows", label: "Filas (una por línea, columnas separadas con |; la primera es el encabezado)", multiline: true }],
    defaults: { rows: "| Antes | Ahora\nRutina | Ninguna | 20 min por día\nFoco | Disperso | Una meta\nResultado | Irregular | Constante" },
  },
  "sticky-notes": {
    label: "Notas adhesivas",
    group: "Listas y comparaciones",
    fields: [{ key: "items", label: "Notas (una por línea, hasta 6)", multiline: true }],
    defaults: { items: "Dormir bien\nMoverme 30 min\nLeer 10 páginas\nAgradecer algo" },
  },
  post: {
    label: "Publicación de red social",
    group: "Interfaces y mockups",
    fields: [
      { key: "name", label: "Nombre" },
      { key: "handle", label: "Usuario" },
      { key: "text", label: "Texto", multiline: true },
      { key: "likes", label: "Me gusta" },
      { key: "comments", label: "Comentarios" },
    ],
    defaults: { name: "Tu nombre", handle: "@tucuenta", text: "Nadie habla de lo aburrido que es ser constante. Y es justamente lo que funciona.", likes: "1.204", comments: "87" },
  },
  notifications: {
    label: "Notificaciones",
    group: "Interfaces y mockups",
    fields: [
      { key: "app", label: "Nombre de la app" },
      { key: "items", label: "Notificaciones (una por línea)", multiline: true },
    ],
    defaults: { app: "Tu cuenta", items: "Nuevo mensaje: «¿Cómo empiezo?»\n12 personas guardaron tu publicación\nTenés 5 seguidores nuevos" },
  },
  polaroid: {
    label: "Foto estilo polaroid",
    group: "Imágenes",
    usesImage: true,
    fields: [{ key: "caption", label: "Texto escrito abajo" }],
    defaults: { caption: "Día 1" },
  },
  "store-contrast": {
    label: "Local vacío vs. lleno",
    group: "Google Maps",
    fields: [
      { key: "leftLabel", label: "Etiqueta izquierda" },
      { key: "rightLabel", label: "Etiqueta derecha" },
    ],
    defaults: { leftLabel: "Sin reseñas", rightLabel: "Con 50 reseñas ★★★★★" },
  },
  "maps-compare": {
    label: "Dos fichas de Maps",
    group: "Google Maps",
    fields: [
      { key: "aName", label: "Negocio A" },
      { key: "aRating", label: "Puntaje A" },
      { key: "aCount", label: "Reseñas A" },
      { key: "bName", label: "Negocio B" },
      { key: "bRating", label: "Puntaje B" },
      { key: "bCount", label: "Reseñas B" },
      { key: "category", label: "Rubro" },
    ],
    defaults: { aName: "Negocio A", aRating: "3.8", aCount: "12", bName: "Negocio B", bRating: "4.9", bCount: "127", category: "Pizzería" },
  },
  "maps-search": {
    label: "Búsqueda local en Maps",
    group: "Google Maps",
    fields: [
      { key: "query", label: "Búsqueda" },
      { key: "r1", label: "Resultado 1" },
      { key: "r2", label: "Resultado 2" },
      { key: "r3", label: "Resultado 3" },
    ],
    defaults: { query: "pizzería cerca", r1: "La Esquina Pizzería", r2: "Pizza al Paso", r3: "Don Tano" },
  },
  "presence-mix": {
    label: "Pilares de presencia online",
    group: "Google Maps",
    fields: [
      { key: "p1", label: "Pilar 1" },
      { key: "p2", label: "Pilar 2" },
      { key: "p3", label: "Pilar 3" },
      { key: "p4", label: "Pilar 4" },
      { key: "result", label: "Resultado" },
    ],
    defaults: { p1: "Reseñas", p2: "Fotos", p3: "Respuestas", p4: "Info al día", result: "Ficha más completa y confiable" },
  },
  "qr-stand": {
    label: "Soporte QR en mesa",
    group: "Google Maps",
    fields: [
      { key: "headline", label: "Texto del soporte" },
      { key: "sub", label: "Texto chico" },
      { key: "seed", label: "Enlace que abre el QR (escaneable)" },
    ],
    defaults: { headline: "¿Te gustó?", sub: "Escaneá y dejanos tu reseña", seed: "https://ejemplo.com" },
  },
  "review-reply": {
    label: "Respuesta a reseña",
    group: "Google Maps",
    fields: [
      { key: "author", label: "Autor de la reseña" },
      { key: "review", label: "Reseña", multiline: true },
      { key: "business", label: "Encabezado de la respuesta" },
      { key: "reply", label: "Respuesta", multiline: true },
    ],
    defaults: {
      author: "Martín G.",
      review: "La muzza, un golazo. Llegó calentita y el delivery fue rapidísimo.",
      business: "Respuesta del propietario",
      reply: "¡Gracias, Martín! Qué bueno que te gustó. Te esperamos la próxima.",
    },
  },
  "whatsapp-chat": {
    label: "Chat de WhatsApp",
    group: "Google Maps",
    fields: [
      { key: "name", label: "Nombre del negocio" },
      { key: "m1", label: "Mensaje 1", multiline: true },
      { key: "m2", label: "Respuesta del cliente", multiline: true },
      { key: "m3", label: "Mensaje con enlace", multiline: true },
    ],
    defaults: {
      name: "Tu negocio",
      m1: "¡Hola! ¿Todo bien con el pedido?",
      m2: "¡Todo perfecto!",
      m3: "¿Todo bien? Si nos dejás una reseña nos ayudás un montón 🙌",
    },
  },
  "photo-reviews": {
    label: "Reseñas con foto",
    group: "Google Maps",
    usesImage: true,
    fields: [
      { key: "r1", label: "Reseña 1" },
      { key: "r2", label: "Reseña 2" },
      { key: "r3", label: "Reseña 3" },
      { key: "r4", label: "Reseña 4" },
    ],
    defaults: { r1: "Increíble la muzza", r2: "El mejor lugar del barrio", r3: "Volvemos seguro", r4: "Atención de 10" },
  },
};

export function makeVisual(kind: VisualKind, props: Record<string, string> = {}): Visual {
  return { kind, props: { ...VISUALS[kind].defaults, ...props } };
}

/** Visual sugerido según el papel del slide y el estilo de imágenes elegido. */
export function suggestVisual(role: SlideRole, style: ImageStyle, tipIndex = 0): VisualKind {
  switch (role) {
    case "hook":
      return style === "fotos" ? "photo" : style === "graficos" ? "stats" : style === "diagramas" ? "comparison" : "phone";
    case "problem":
      return style === "graficos" ? "stats" : style === "fotos" ? "photo" : "comparison";
    case "example":
      return style === "capturas" || style === "mockups" ? "review" : "comparison";
    case "how":
      return "steps";
    case "proof":
      return style === "graficos" || style === "diagramas" ? "stats" : "quote";
    case "tip": {
      const byStyle: Record<ImageStyle, VisualKind[]> = {
        mockups: ["phone", "chat", "review", "qr"],
        "3d": ["phone", "qr", "review", "chat"],
        diagramas: ["checklist", "steps", "comparison", "checklist"],
        capturas: ["chat", "review", "phone", "qr"],
        graficos: ["stats", "checklist", "stats", "checklist"],
        fotos: ["photo", "photo", "review", "photo"],
      };
      const list = byStyle[style];
      return list[tipIndex % list.length];
    }
    case "cta":
      return "cta-button";
  }
}
