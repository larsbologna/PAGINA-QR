import type { ContentBrief, ContentCategory, SlideRole } from "../types";

// Cada tipo de carrusel cambia cómo se cuenta la historia: los nombres de los campos
// del brief, qué papel cumple cada slide y qué visuales se sugieren.

type FieldKey = Exclude<keyof ContentBrief, "category" | "tone" | "extra">;

export interface CategoryInfo {
  id: ContentCategory;
  label: string;
  description: string;
  /** Ejemplos de temáticas, para inspirar. */
  examples: string[];
  fields: Record<FieldKey, { label: string; placeholder: string }>;
  roles: Record<SlideRole, { label: string; purpose: string }>;
}

const PERSONAL_FIELDS: CategoryInfo["fields"] = {
  topic: { label: "Temática del carrusel", placeholder: "Ej.: Lo que aprendí después de fallar 3 veces" },
  businessName: { label: "Tu nombre o cuenta", placeholder: "Ej.: @tucuenta" },
  goal: { label: "Para qué lo publicás", placeholder: "Ej.: que lo guarden y lo compartan" },
  audience: { label: "Para quién es", placeholder: "Ej.: gente que arranca un proyecto propio" },
  problem: { label: "Qué le pasa a quien lo lee", placeholder: "Ej.: empieza con todo y abandona a las dos semanas" },
  benefit: { label: "Qué se lleva", placeholder: "Ej.: una forma más simple de sostener lo que empieza" },
  offer: { label: "Recurso para ofrecer (opcional)", placeholder: "Ej.: mi newsletter, una guía, una mentoría" },
  cta: { label: "Llamada a la acción", placeholder: "Ej.: Guardalo para cuando lo necesites" },
};

export const CATEGORIES: Record<ContentCategory, CategoryInfo> = {
  negocio: {
    id: "negocio",
    label: "Negocios",
    description: "Marketing, ventas, clientes y estrategia. Cierra con una acción comercial.",
    examples: ["Cómo conseguir más reseñas en Google", "Por qué tus clientes no vuelven", "3 errores al poner precios"],
    fields: {
      topic: { label: "Temática del carrusel", placeholder: "Ej.: Cómo conseguir más reseñas en Google" },
      businessName: { label: "Nombre del negocio", placeholder: "Ej.: Pizzería Don Tano" },
      goal: { label: "Objetivo comercial", placeholder: "Ej.: que me escriban por WhatsApp" },
      audience: { label: "Público objetivo", placeholder: "Ej.: dueños de locales gastronómicos" },
      problem: { label: "Problema que resolvemos", placeholder: "Ej.: el local está vacío entre semana" },
      benefit: { label: "Beneficio principal", placeholder: "Ej.: más clientes que llegan recomendados" },
      offer: { label: "Servicio o producto", placeholder: "Ej.: sistema de reseñas en 7 días" },
      cta: { label: "Llamada a la acción", placeholder: "Ej.: Escribí RESEÑAS y te paso la guía" },
    },
    roles: {
      hook: { label: "Gancho", purpose: "Frenar el scroll con una idea fuerte." },
      problem: { label: "Problema", purpose: "Mostrar qué está fallando hoy." },
      example: { label: "Ejemplo", purpose: "Hacerlo concreto con una comparación." },
      how: { label: "Cómo funciona", purpose: "Explicar el mecanismo en pocos pasos." },
      proof: { label: "Argumento", purpose: "Demostrar por qué vale la pena." },
      tip: { label: "Consejo", purpose: "Algo que se pueda aplicar hoy." },
      cta: { label: "Llamada a la acción", purpose: "Decir qué hacer ahora." },
    },
  },
  crecimiento: {
    id: "crecimiento",
    label: "Crecimiento personal",
    description: "Mentalidad, decisiones y autoconocimiento. Invita a reflexionar y a aplicar algo.",
    examples: ["Lo que cambia cuando dejás de compararte", "Señales de que estás creciendo (aunque no lo parezca)", "Cómo decir que no sin culpa"],
    fields: PERSONAL_FIELDS,
    roles: {
      hook: { label: "Gancho", purpose: "Una idea que haga frenar y pensar." },
      problem: { label: "La trampa", purpose: "La creencia o el hábito que frena." },
      example: { label: "Antes y después", purpose: "Mostrar el cambio de mirada con un contraste." },
      how: { label: "El cambio", purpose: "Qué hacer distinto, en pocos pasos." },
      proof: { label: "Por qué importa", purpose: "La reflexión de fondo." },
      tip: { label: "Práctica", purpose: "Algo concreto para probar hoy." },
      cta: { label: "Cierre", purpose: "Invitar a guardar, compartir o seguir." },
    },
  },
  motivacion: {
    id: "motivacion",
    label: "Motivación",
    description: "Impulso para seguir. Frases cortas, mucho aire y un cierre que acompaña.",
    examples: ["Para los días en que nada sale", "No estás atrasado/a", "Lo difícil también es avance"],
    fields: PERSONAL_FIELDS,
    roles: {
      hook: { label: "Gancho", purpose: "Una frase que interpele." },
      problem: { label: "Lo que sentís", purpose: "Nombrar lo que le pasa a quien lee." },
      example: { label: "Otra mirada", purpose: "Darle vuelta a la situación." },
      how: { label: "Lo que sí podés hacer", purpose: "Un paso chico y posible." },
      proof: { label: "La idea clave", purpose: "La idea que tiene que quedar." },
      tip: { label: "Recordatorio", purpose: "Una frase para volver a leer." },
      cta: { label: "Cierre", purpose: "Acompañar e invitar a guardarlo o compartirlo." },
    },
  },
  proceso: {
    id: "proceso",
    label: "Mi proceso",
    description: "Tu historia en primera persona: dónde arrancaste, qué salió mal y qué aprendiste.",
    examples: ["Así arranqué mi proyecto desde cero", "Lo que nadie ve de emprender", "6 meses después: qué cambió"],
    fields: {
      ...PERSONAL_FIELDS,
      topic: { label: "Temática del carrusel", placeholder: "Ej.: 6 meses construyendo mi marca: lo que aprendí" },
      problem: { label: "Dónde arrancaste", placeholder: "Ej.: sin clientes, sin plan y con mucho miedo" },
      benefit: { label: "Dónde estás hoy", placeholder: "Ej.: con una rutina que sostengo y los primeros clientes" },
    },
    roles: {
      hook: { label: "Gancho", purpose: "Presentar la historia con intriga." },
      problem: { label: "El punto de partida", purpose: "Dónde arrancaste, sin maquillar." },
      example: { label: "Lo que salió mal", purpose: "El error o el momento difícil." },
      how: { label: "Lo que cambié", purpose: "La decisión que hizo la diferencia." },
      proof: { label: "Dónde estoy hoy", purpose: "El resultado, contado con honestidad." },
      tip: { label: "Aprendizaje", purpose: "Una lección que le sirva a otra persona." },
      cta: { label: "Cierre", purpose: "Invitar a seguir el proceso o contar el suyo." },
    },
  },
  habitos: {
    id: "habitos",
    label: "Hábitos y productividad",
    description: "Rutinas, foco y organización. Muy práctico, con pasos y listas.",
    examples: ["La rutina de 20 minutos que me ordenó la semana", "Cómo dejar de procrastinar lo importante", "Hábitos chicos que suman"],
    fields: {
      ...PERSONAL_FIELDS,
      topic: { label: "Temática del carrusel", placeholder: "Ej.: Cómo armar una rutina que puedas sostener" },
      problem: { label: "Qué le cuesta a quien lo lee", placeholder: "Ej.: arranca la semana a full y el miércoles abandona" },
      benefit: { label: "Qué resultado busca", placeholder: "Ej.: avanzar un poco todos los días sin quemarse" },
    },
    roles: {
      hook: { label: "Gancho", purpose: "Prometer algo concreto y realista." },
      problem: { label: "El problema", purpose: "Lo que hace que no funcione." },
      example: { label: "Antes y después", purpose: "Cómo se ve con y sin el hábito." },
      how: { label: "El sistema", purpose: "El método en pocos pasos." },
      proof: { label: "Por qué funciona", purpose: "La lógica detrás, sin inventar datos." },
      tip: { label: "Paso", purpose: "Una acción concreta para aplicar." },
      cta: { label: "Cierre", purpose: "Invitar a guardarlo y probarlo." },
    },
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

/** Info del tipo de carrusel; mientras no se elija, se usan los nombres de Negocios. */
export function categoryOf(brief: ContentBrief): CategoryInfo {
  return brief.category ? CATEGORIES[brief.category] : CATEGORIES.negocio;
}
