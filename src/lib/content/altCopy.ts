import type { ContentCategory, SlideRole } from "../types";

// Textos alternativos para las versiones 2 y 3 de una propuesta. La versión 1 usa los
// textos base. Cada entrada recibe los datos del brief ya limpios.

export interface BriefText {
  topic: string;
  name: string;
  audience: string;
  problem: string;
  benefit: string;
  offer: string;
  cta: string;
}

interface Alt {
  title: string;
  subtitle: string;
}

type AltFn = (f: BriefText) => Alt;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lc = (s: string) => (s.length > 1 && /[A-ZÁÉÍÓÚÑ]/.test(s[1]) ? s : s.charAt(0).toLowerCase() + s.slice(1));

const ALT: Record<ContentCategory, Partial<Record<SlideRole, [AltFn, AltFn]>>> = {
  negocio: {
    hook: [
      (f) => ({ title: f.topic || "Lo que separa a los negocios llenos", subtitle: f.audience ? `Para ${lc(f.audience)} que quieren crecer en serio` : "Y cómo aplicarlo en el tuyo" }),
      (f) => ({ title: f.topic || "Esto cambia cómo te eligen", subtitle: "Guardalo: te va a servir" }),
    ],
    problem: [
      (f) => ({ title: "¿Te pasa esto?", subtitle: f.problem ? `${cap(f.problem)}.` : "Hacés todo bien y aun así no te eligen." }),
      (f) => ({ title: "El error más común", subtitle: f.problem ? `${cap(f.problem)}. Y casi nadie lo ve.` : "Creer que con un buen producto alcanza." }),
    ],
    example: [
      () => ({ title: "Dos negocios, un mismo barrio", subtitle: "La diferencia no está en el precio." }),
      (f) => ({ title: "Antes y después", subtitle: f.benefit ? `Así se ve ${lc(f.benefit)}.` : "Lo mismo, contado de otra forma." }),
    ],
    how: [
      (f) => ({ title: "El método, paso a paso", subtitle: f.offer ? `Lo que aplicamos en ${lc(f.offer)}.` : "Simple de aplicar desde esta semana." }),
      () => ({ title: "Cómo se hace", subtitle: "Sin vueltas y sin herramientas raras." }),
    ],
    proof: [
      () => ({ title: "Lo que se repite, funciona", subtitle: "Los resultados vienen del sistema, no de un golpe de suerte." }),
      (f) => ({ title: "Por qué vale la pena", subtitle: f.benefit ? `Porque ${lc(f.benefit)} se sostiene en el tiempo.` : "Porque lo que construís hoy te trae clientes mañana." }),
    ],
    cta: [
      (f) => ({ title: "¿Lo aplicamos juntos?", subtitle: f.cta ? `${cap(f.cta)}.` : "Escribinos y te contamos cómo empezar." }),
      (f) => ({ title: "Tu próximo paso", subtitle: f.cta ? `${cap(f.cta)}.` : "Mandanos un mensaje y lo vemos con tu caso." }),
    ],
  },
  crecimiento: {
    hook: [
      (f) => ({ title: f.topic || "Una idea que me cambió la forma de ver", subtitle: "Tomate un minuto para esto" }),
      (f) => ({ title: f.topic || "No necesitás más motivación", subtitle: "Necesitás otra mirada" }),
    ],
    problem: [
      (f) => ({ title: "Lo que nadie dice", subtitle: f.problem ? `${cap(f.problem)}.` : "Que la comparación te roba energía todos los días." }),
      (f) => ({ title: "¿Te suena?", subtitle: f.problem ? `${cap(f.problem)}.` : "Empezás con todo y a los pocos días te frenás." }),
    ],
    example: [
      () => ({ title: "Dos formas de verlo", subtitle: "Cambia el resultado, no la situación." }),
      () => ({ title: "Del «no puedo» al «todavía»", subtitle: "Una palabra cambia cómo encarás todo." }),
    ],
    how: [
      () => ({ title: "Cómo empezar hoy", subtitle: "Pasos chicos, sin presión." }),
      () => ({ title: "El cambio en la práctica", subtitle: "Tres movimientos que podés sostener." }),
    ],
    proof: [
      (f) => ({ title: "Lo importante", subtitle: f.benefit ? `${cap(f.benefit)} se construye de a poco.` : "No se trata de hacerlo perfecto, sino de seguir." }),
      () => ({ title: "Para recordar", subtitle: "Ser constante le gana a ser intenso." }),
    ],
    cta: [
      (f) => ({ title: "Guardalo para volver", subtitle: f.cta ? `${cap(f.cta)}.` : "Y compartilo con quien lo necesite." }),
      (f) => ({ title: "¿Te hizo pensar?", subtitle: f.cta ? `${cap(f.cta)}.` : "Contame en los comentarios y seguime para más." }),
    ],
  },
  motivacion: {
    hook: [
      (f) => ({ title: f.topic || "Si hoy costó, leé esto", subtitle: "Despacio." }),
      (f) => ({ title: f.topic || "Todavía no terminó", subtitle: "Y vos tampoco." }),
    ],
    problem: [
      (f) => ({ title: "Está bien que cueste", subtitle: f.problem ? `${cap(f.problem)}.` : "No avanzar rápido no es no avanzar." }),
      (f) => ({ title: "No sos el único", subtitle: f.problem ? `${cap(f.problem)}.` : "Todos tenemos días en los que nada sale." }),
    ],
    example: [
      () => ({ title: "Mirá para atrás", subtitle: "Hace un tiempo esto que hoy hacés te parecía imposible." }),
      () => ({ title: "Cambiá la pregunta", subtitle: "No «¿por qué a mí?», sino «¿qué hago con esto?»." }),
    ],
    how: [
      () => ({ title: "Un paso, no diez", subtitle: "Elegí lo más chico que puedas hacer hoy." }),
      () => ({ title: "Para hoy alcanza", subtitle: "Con poco también se avanza." }),
    ],
    proof: [
      () => ({ title: "Quedate con esto", subtitle: "El progreso lento sigue siendo progreso." }),
      () => ({ title: "Lo que importa", subtitle: "Volver a intentarlo ya es avanzar." }),
    ],
    cta: [
      (f) => ({ title: "Volvé a leerlo cuando lo necesites", subtitle: f.cta ? `${cap(f.cta)}.` : "Guardalo y compartilo." }),
      (f) => ({ title: "Mandáselo a alguien", subtitle: f.cta ? `${cap(f.cta)}.` : "Que hoy lo necesite tanto como vos." }),
    ],
  },
  proceso: {
    hook: [
      (f) => ({ title: f.topic || "Lo que aprendí en el camino", subtitle: "Sin filtro" }),
      (f) => ({ title: f.topic || "Así fue, de verdad", subtitle: "Te cuento todo, también lo que salió mal" }),
    ],
    problem: [
      (f) => ({ title: "El comienzo", subtitle: f.problem ? `${cap(f.problem)}.` : "[Contá cómo arrancaste]" }),
      (f) => ({ title: "De dónde vengo", subtitle: f.problem ? `${cap(f.problem)}.` : "[Contá tu punto de partida]" }),
    ],
    example: [
      () => ({ title: "El momento difícil", subtitle: "Hubo un punto en el que casi largo todo:" }),
      () => ({ title: "Lo que no funcionó", subtitle: "Probé muchas cosas. Esta fue la que más me enseñó:" }),
    ],
    how: [
      () => ({ title: "La decisión clave", subtitle: "[Qué cambiaste y por qué]" }),
      () => ({ title: "El giro", subtitle: "[El cambio que hizo la diferencia]" }),
    ],
    proof: [
      (f) => ({ title: "Hoy", subtitle: f.benefit ? `${cap(f.benefit)}.` : "[Dónde estás hoy]" }),
      (f) => ({ title: "Dónde estoy ahora", subtitle: f.benefit ? `${cap(f.benefit)}.` : "[Contá el resultado, sin exagerar]" }),
    ],
    cta: [
      (f) => ({ title: "Esto recién empieza", subtitle: f.cta ? `${cap(f.cta)}.` : "Seguime para ver el próximo capítulo." }),
      (f) => ({ title: "¿Y vos en qué etapa estás?", subtitle: f.cta ? `${cap(f.cta)}.` : "Contámelo en los comentarios." }),
    ],
  },
  habitos: {
    hook: [
      (f) => ({ title: f.topic || "El hábito que más me cambió la semana", subtitle: "Y cómo hacerlo tuyo" }),
      (f) => ({ title: f.topic || "Menos fuerza de voluntad, más sistema", subtitle: "Guardalo para el lunes" }),
    ],
    problem: [
      (f) => ({ title: "El problema no sos vos", subtitle: f.problem ? `${cap(f.problem)}.` : "Es que el plan depende de tener ganas." }),
      (f) => ({ title: "Por qué no dura", subtitle: f.problem ? `${cap(f.problem)}.` : "Empezás con demasiado y no hay forma de sostenerlo." }),
    ],
    example: [
      () => ({ title: "Dos maneras de empezar", subtitle: "Una se abandona. La otra se queda." }),
      () => ({ title: "Lo que cambia todo", subtitle: "Pasar del «todo o nada» al «un poco siempre»." }),
    ],
    how: [
      () => ({ title: "Paso a paso", subtitle: "Un sistema simple para que el hábito se quede." }),
      () => ({ title: "El método", subtitle: "Tres pasos y una regla: no cortar la cadena." }),
    ],
    proof: [
      () => ({ title: "La clave", subtitle: "Lo chico y fijo le gana a lo grande y ocasional." }),
      () => ({ title: "Por qué se sostiene", subtitle: "Porque no necesitás ganas: solo un momento fijo." }),
    ],
    cta: [
      (f) => ({ title: "Probalo 7 días", subtitle: f.cta ? `${cap(f.cta)}.` : "Guardalo y contame cómo te fue." }),
      (f) => ({ title: "Empezá mañana", subtitle: f.cta ? `${cap(f.cta)}.` : "Guardalo para tenerlo a mano." }),
    ],
  },
};

/** Título y subtítulo de la versión N, o null para usar los textos base. */
export function altCopy(category: ContentCategory, role: SlideRole, f: BriefText, version: number): Alt | null {
  const v = ((version % 3) + 3) % 3;
  if (v === 0 || role === "tip") return null;
  const pair = ALT[category][role];
  return pair ? pair[v - 1](f) : null;
}

/** Consejos extra por tipo para que cada versión use otros. */
export const EXTRA_TIPS: Record<ContentCategory, { title: string; subtitle: string }[]> = {
  negocio: [
    { title: "Pedí opinión a tus mejores clientes", subtitle: "Te dicen qué valoran y cómo contarlo." },
    { title: "Mostrá el detrás de escena", subtitle: "La gente confía más en lo que puede ver." },
    { title: "Respondé rápido", subtitle: "La velocidad también es parte del servicio." },
    { title: "Medí una sola cosa", subtitle: "Elegí un número y miralo todas las semanas." },
  ],
  crecimiento: [
    { title: "Hablate como a un amigo", subtitle: "Con la misma paciencia que le tendrías a otro." },
    { title: "Elegí qué soltar", subtitle: "Decir que no también es avanzar." },
    { title: "Mirá tu semana, no tu día", subtitle: "Un mal día no define tu proceso." },
    { title: "Anotá una victoria diaria", subtitle: "Entrenás la mirada para ver lo que sí hacés." },
  ],
  motivacion: [
    { title: "Lo difícil también es avance", subtitle: "Que cueste no significa que vayas mal." },
    { title: "No tenés que poder con todo", subtitle: "Elegí lo importante y soltá el resto." },
    { title: "Pausar no es abandonar", subtitle: "Descansá y volvé." },
    { title: "Confiá en lo que ya hiciste", subtitle: "Llegaste hasta acá por algo." },
  ],
  proceso: [
    { title: "Documentá desde el día uno", subtitle: "Después vas a querer ver de dónde saliste." },
    { title: "No esperes a tenerlo todo", subtitle: "Lo perfecto llega haciendo, no esperando." },
    { title: "Rodeate de gente en la misma", subtitle: "Compartir el camino lo hace más llevadero." },
    { title: "Celebrá los avances chicos", subtitle: "Son los que te mantienen en movimiento." },
  ],
  habitos: [
    { title: "Hacelo a la misma hora", subtitle: "La rutina decide por vos." },
    { title: "Sumá de a uno", subtitle: "Cuando el primero sale solo, agregá otro." },
    { title: "Recompensate al terminar", subtitle: "Algo chico que asocies con cumplir." },
    { title: "Si fallás, retomá enseguida", subtitle: "Nunca dos días seguidos sin hacerlo." },
  ],
};
