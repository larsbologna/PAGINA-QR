import type { Project, Slide, SlideRole, VisualKind } from "@/lib/types";
import { createProject } from "@/lib/defaults";
import { makeVisual } from "@/lib/visuals";
import { uid } from "@/lib/ids";

// Proyecto de ejemplo precargado: "Cómo las reseñas de Google Maps llenan tu local".
// Las interfaces de Maps y WhatsApp son ilustraciones y no se presentan como capturas.
// No incluye estadísticas ni promete posiciones en el buscador.

function s(role: SlideRole, title: string, subtitle: string, body: string, kind: VisualKind, props: Record<string, string> = {}): Slide {
  return { id: uid("s_"), role, title, subtitle, body, visual: makeVisual(kind, props), overrides: {} };
}

export const GOOGLE_MAPS_TEMPLATE_NAME = "Cómo las reseñas de Google Maps llenan tu local";

export function createGoogleMapsProject(): Project {
  const base = createProject(GOOGLE_MAPS_TEMPLATE_NAME);
  const slides: Slide[] = [
    s("hook", "Tu negocio no necesita más *anuncios*", "Necesita *50 reseñas* de 5 estrellas", "Te muestro el sistema que usamos para llenar locales", "store-contrast", {
      leftLabel: "Pocas reseñas",
      rightLabel: "50 reseñas ★★★★★",
    }),
    s("problem", "¿A cuál entrás?", "Mismo rubro, misma cuadra.", "", "maps-compare", {
      aName: "Negocio A",
      aRating: "3.8",
      aCount: "12",
      bName: "Negocio B",
      bRating: "4.9",
      bCount: "127",
      category: "Pizzería",
    }),
    s(
      "example",
      "Google piensa *igual que vos*.",
      "Las reseñas, la relevancia y la distancia pueden influir en qué negocios aparecen en las búsquedas locales.",
      "",
      "maps-search",
      { query: "pizzería cerca", r1: "La Esquina Pizzería", r2: "Pizza al Paso", r3: "Don Tano" },
    ),
    s("how", "Así te trae *clientes*", "", "", "steps", {
      s1: "Cliente busca",
      s2: "Encuentra negocios relevantes",
      s3: "Compara opciones y visita un local",
      s4: "",
    }),
    s("proof", "No es suerte. *Es estrategia.*", "Reseñas + Fotos + Respuestas + Información actualizada.", "", "presence-mix", {
      p1: "Reseñas",
      p2: "Fotos",
      p3: "Respuestas",
      p4: "Info al día",
      result: "Una ficha más completa y confiable",
    }),
    s("tip", "1. QR en el *local*", "En ticket, mesa o mostrador. Facilitá que tus clientes compartan su experiencia.", "", "qr-stand", {
      headline: "¿Te gustó?",
      sub: "Escaneá y dejanos tu reseña",
      seed: "https://ejemplo.com",
    }),
    s("tip", "2. Respondé tus *reseñas*", "Agradecé los comentarios y respondé de forma personalizada.", "", "review-reply", {
      author: "Martín G.",
      review: "La muzza, un golazo. Llegó calentita y el delivery fue rapidísimo.",
      business: "Respuesta del propietario",
      reply: "Gracias por elegir nuestra pizzería en Berazategui, Martín. ¡Te esperamos la próxima!",
    }),
    s("tip", "3. Automatizá por *WhatsApp*", "Después de una compra, invitá al cliente a compartir su experiencia con un enlace directo.", "", "whatsapp-chat", {
      name: "Pizzería",
      m1: "¡Hola Lucía! ¿Llegó bien el pedido?",
      m2: "¡Sí, todo riquísimo!",
      m3: "¿Todo bien? Si nos dejás una reseña nos ayudás un montón",
    }),
    s("tip", "4. Pedí reseñas con *foto*", "Invitá a tus clientes a compartir imágenes de sus compras y experiencias reales.", "", "photo-reviews", {
      r1: "Increíble la muzza",
      r2: "El café, un diez",
      r3: "Volvemos seguro",
      r4: "Lindo lugar y buena atención",
    }),
    s("cta", "¿Armamos tu sistema en *7 días*?", "Escribí *MAPS* y te paso la plantilla.", "Tu Agencia · Llenamos locales, no vendemos humo", "cta-button", {
      label: "Escribí MAPS",
      handle: "",
    }),
  ];

  return {
    ...base,
    stage: "edit",
    brief: {
      ...base.brief,
      category: "negocio",
      topic: GOOGLE_MAPS_TEMPLATE_NAME,
      businessName: "Tu Agencia",
      goal: "Que los dueños de locales nos escriban para armar su sistema de reseñas",
      audience: "Dueños de locales gastronómicos y comercios de barrio",
      problem: "El local tiene buen producto pero pocas reseñas y pierde clientes frente a la competencia",
      benefit: "Más clientes que eligen el local por su reputación en Google Maps",
      offer: "Sistema de reseñas en 7 días",
      cta: "Escribí MAPS y te paso la plantilla",
      tone: "directo",
    },
    design: {
      ...base.design,
      background: "#0a0a0b",
      surface: "#17171a",
      text: "#ffffff",
      accent: "#ffc94d",
      titleFont: "bricolage",
      bodyFont: "inter",
      style: "bold",
      intensity: 55,
      imageStyle: "mockups",
    },
    slideCount: slides.length,
    slides,
  };
}
