import type { ImageStyle, SlideRole, Visual, VisualKind } from "./types";

// Catálogo de visuales: qué textos editables tiene cada uno y sus valores iniciales.
// La parte gráfica de cada visual está en components/visuals.

export interface VisualField {
  key: string;
  label: string;
  multiline?: boolean;
}

export interface VisualSpec {
  label: string;
  group: "General" | "Google Maps";
  fields: VisualField[];
  defaults: Record<string, string>;
  /** Necesita una imagen subida para lucirse. */
  usesImage?: boolean;
}

export const VISUALS: Record<VisualKind, VisualSpec> = {
  none: { label: "Sin visual", group: "General", fields: [], defaults: {} },
  photo: {
    label: "Fotografía integrada",
    group: "General",
    usesImage: true,
    fields: [{ key: "caption", label: "Epígrafe" }],
    defaults: { caption: "" },
  },
  phone: {
    label: "Mockup de teléfono",
    group: "General",
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
    group: "General",
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
    group: "General",
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
    group: "General",
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
    group: "General",
    fields: [{ key: "items", label: "Ítems (uno por línea)", multiline: true }],
    defaults: { items: "Primer punto\nSegundo punto\nTercer punto" },
  },
  quote: {
    label: "Cita destacada",
    group: "General",
    fields: [
      { key: "text", label: "Cita", multiline: true },
      { key: "author", label: "Autor" },
    ],
    defaults: { text: "La mejor publicidad es un cliente conforme.", author: "" },
  },
  qr: {
    label: "Código QR",
    group: "General",
    fields: [
      { key: "label", label: "Texto junto al QR" },
      { key: "seed", label: "Enlace que abre el QR (escaneable)" },
    ],
    defaults: { label: "Escaneá y dejanos tu opinión", seed: "https://ejemplo.com" },
  },
  chat: {
    label: "Conversación de chat",
    group: "General",
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
    group: "General",
    fields: [
      { key: "author", label: "Autor" },
      { key: "stars", label: "Estrellas (1 a 5)" },
      { key: "text", label: "Texto", multiline: true },
    ],
    defaults: { author: "Laura M.", stars: "5", text: "Atención impecable y todo riquísimo. Volvemos seguro." },
  },
  "cta-button": {
    label: "Botón de llamada a la acción",
    group: "General",
    fields: [
      { key: "label", label: "Texto del botón" },
      { key: "handle", label: "Usuario o contacto" },
    ],
    defaults: { label: "Escribime", handle: "" },
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
    ],
    defaults: { headline: "¿Te gustó?", sub: "Escaneá y dejanos tu reseña" },
  },
  "review-reply": {
    label: "Respuesta a reseña",
    group: "Google Maps",
    fields: [
      { key: "author", label: "Autor de la reseña" },
      { key: "review", label: "Reseña", multiline: true },
      { key: "business", label: "Nombre del negocio" },
      { key: "reply", label: "Respuesta", multiline: true },
    ],
    defaults: {
      author: "Martín G.",
      review: "La muzza, un golazo. Llegó calentita y el delivery fue rapidísimo.",
      business: "Propietario",
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
