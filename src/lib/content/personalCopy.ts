import type { ContentCategory, ImageStyle, SlideRole, Tone, VisualKind } from "../types";

// Textos base para los carruseles de crecimiento personal, motivación, proceso y
// hábitos. Son un punto de partida: lo que va entre [corchetes] es para completar
// con tu experiencia, y la exportación avisa si queda alguno sin completar.

export type PersonalCategory = Exclude<ContentCategory, "negocio">;

export interface PersonalFields {
  topic: string;
  name: string;
  audience: string;
  problem: string;
  benefit: string;
  offer: string;
  cta: string;
}

export interface PersonalSlide {
  title: string;
  subtitle: string;
  body: string;
  visual: VisualKind;
  props?: Record<string, string>;
}

interface Tip {
  title: string;
  subtitle: string;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function lc(s: string): string {
  if (s.length > 1 && /[A-ZÁÉÍÓÚÑ]/.test(s[1])) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const HOOK_SUB: Record<PersonalCategory, Record<Tone, string>> = {
  crecimiento: {
    profesional: "Una reflexión para tomar mejores decisiones",
    directo: "Leelo despacio. Es para vos.",
    educativo: "Te lo explico en pocos slides",
    persuasivo: "Esto puede cambiar cómo encarás tu semana",
    cercano: "Algo que me hubiera gustado leer antes",
  },
  motivacion: {
    profesional: "Un recordatorio para seguir",
    directo: "Leelo despacio.",
    educativo: "Lo que conviene recordar cuando cuesta",
    persuasivo: "Todavía no terminó",
    cercano: "Esto es para vos, si hoy está costando",
  },
  proceso: {
    profesional: "Lo que funcionó, lo que no y lo que aprendí",
    directo: "Sin filtro: lo bueno, lo malo y lo que aprendí",
    educativo: "Mi proceso, paso a paso, para que te sirva",
    persuasivo: "Si estás arrancando, esto te ahorra tiempo",
    cercano: "Te cuento cómo fue de verdad",
  },
  habitos: {
    profesional: "Un método simple y realista",
    directo: "Sin fuerza de voluntad infinita",
    educativo: "Cómo funciona, paso a paso",
    persuasivo: "Diez minutos por día alcanzan para empezar",
    cercano: "Lo que a mí me sirvió para no abandonar",
  },
};

const TIPS: Record<PersonalCategory, Tip[]> = {
  crecimiento: [
    { title: "Escribí cómo te sentís", subtitle: "Cinco minutos a la noche alcanzan para ver patrones que de día no ves." },
    { title: "Achicá la meta", subtitle: "Si no la podés cumplir en un mal día, es demasiado grande." },
    { title: "Cuidá tu entorno", subtitle: "Pasá más tiempo con quien te empuja y menos con quien te achica." },
    { title: "Celebrá lo chico", subtitle: "Anotá un avance por día, por mínimo que parezca." },
  ],
  motivacion: [
    { title: "Tu ritmo es válido", subtitle: "Compararte con lo que otros muestran no dice nada de tu proceso." },
    { title: "Descansar también es avanzar", subtitle: "Parar a tiempo es lo que te permite seguir." },
    { title: "Un mal día no borra el camino", subtitle: "Mañana retomás desde donde quedaste, no desde cero." },
    { title: "Mirá cuánto avanzaste", subtitle: "Pensá dónde estabas hace un año." },
  ],
  proceso: [
    { title: "Empezá aunque no tengas todo claro", subtitle: "La claridad llega haciendo, no esperando." },
    { title: "Mostrá el proceso", subtitle: "Contar lo que hacés, aunque no esté terminado, te acerca a la gente correcta." },
    { title: "Medí tu avance contra vos", subtitle: "Tu punto de comparación es dónde estabas, no dónde está otro." },
    { title: "Pedí ayuda antes", subtitle: "Lo que más tiempo me hizo perder fue querer resolver todo sin preguntar." },
  ],
  habitos: [
    { title: "Empezá ridículamente chico", subtitle: "Dos minutos cuentan. Lo importante es no cortar la cadena." },
    { title: "Prepará el entorno", subtitle: "Dejá a mano lo que necesitás y alejá lo que te distrae." },
    { title: "Usá un registro visible", subtitle: "Marcar cada día cumplido da ganas de seguir." },
    { title: "Planificá el día malo", subtitle: "Definí de antemano la versión mínima para cuando no tengas energía." },
  ],
};

const CTA_TITLE: Record<PersonalCategory, string> = {
  crecimiento: "Si te sirvió, guardalo",
  motivacion: "Guardalo para releerlo",
  proceso: "¿Me acompañás en lo que sigue?",
  habitos: "¿Lo probás esta semana?",
};

const CTA_SUB: Record<PersonalCategory, string> = {
  crecimiento: "Y compartilo con alguien que lo necesite hoy.",
  motivacion: "Y mandáselo a alguien que hoy lo necesite.",
  proceso: "Seguime para ver cómo continúa.",
  habitos: "Guardalo y contame cómo te fue.",
};

const CTA_BUTTON: Record<PersonalCategory, string> = {
  crecimiento: "Guardalo",
  motivacion: "Guardalo",
  proceso: "Seguime",
  habitos: "Guardalo",
};

/** Visual del consejo según el estilo de imágenes, priorizando lo que va con contenido personal. */
function tipVisual(category: PersonalCategory, style: ImageStyle, i: number): VisualKind {
  if (category === "motivacion") return style === "fotos" ? "photo" : "none";
  // En "Mi proceso" las fotos van en los slides de la historia; los aprendizajes van con texto.
  if (style === "fotos" && category !== "proceso") return i === 0 ? "photo" : i % 2 ? "quote" : "none";
  // Se alterna para no repetir el mismo recurso en todos los consejos.
  const cycle: VisualKind[] = style === "graficos" || style === "diagramas" ? ["checklist", "steps", "none", "quote"] : ["checklist", "quote", "none", "quote"];
  return cycle[i % cycle.length];
}

export function personalTip(category: PersonalCategory, i: number, own: Tip[]): Tip {
  return own[i] ?? TIPS[category][i % TIPS[category].length];
}

export function personalSlide(
  category: PersonalCategory,
  role: SlideRole,
  f: PersonalFields,
  tone: Tone,
  imageStyle: ImageStyle,
  tipIndex: number,
  ownTips: Tip[],
): PersonalSlide {
  const problem = f.problem ? `${cap(f.problem)}.` : "";
  const benefit = f.benefit ? lc(f.benefit) : "";

  if (role === "hook") {
    const fallback: Record<PersonalCategory, string> = {
      crecimiento: "Nadie te avisa de esto",
      motivacion: "Para los días en que nada sale",
      proceso: "Te cuento cómo fue de verdad",
      habitos: "Una rutina que sí podés sostener",
    };
    return {
      title: f.topic || fallback[category],
      subtitle: HOOK_SUB[category][tone],
      body: "Deslizá →",
      visual: imageStyle === "fotos" ? "photo" : "none",
    };
  }

  if (role === "tip") {
    const t = personalTip(category, tipIndex, ownTips);
    const prefix = category === "motivacion" ? "" : `${tipIndex + 1}. `;
    const visual = tipVisual(category, imageStyle, tipIndex);
    const props: Record<string, string> =
      visual === "checklist"
        ? { items: "Hacelo hoy, aunque sea en versión mínima\nAnotá cómo te fue\nRepetilo mañana" }
        : visual === "quote"
          ? { text: t.subtitle, author: f.name }
          : visual === "steps"
            ? { s1: "Notalo", s2: "Probalo hoy", s3: "Sostenelo una semana", s4: "" }
            : {};
    return { title: `${prefix}${t.title}`, subtitle: visual === "quote" ? "" : t.subtitle, body: "", visual, props };
  }

  if (role === "cta") {
    return {
      title: CTA_TITLE[category],
      subtitle: f.cta ? `${cap(f.cta)}.` : CTA_SUB[category],
      body: f.offer ? cap(f.offer) : "",
      visual: "cta-button",
      props: { label: f.cta ? cap(f.cta.split(/[.,]/)[0]).slice(0, 28) : CTA_BUTTON[category], handle: f.name },
    };
  }

  switch (category) {
    case "crecimiento":
      switch (role) {
        case "problem":
          return { title: "La trampa en la que caemos", subtitle: problem || "Esperar el momento perfecto para empezar.", body: "", visual: "none" };
        case "example":
          return {
            title: "Cambiá la pregunta",
            subtitle: "No es solo lo que te pasa. Es cómo lo leés.",
            body: "",
            visual: "comparison",
            props: {
              leftTitle: "Antes",
              left: "Me comparo con otros\nEspero tener ganas\nMe juzgo por un mal día",
              rightTitle: "Ahora",
              right: "Me comparo conmigo\nArmo una rutina mínima\nMiro la semana completa",
            },
          };
        case "how":
          return {
            title: "Qué hacer distinto",
            subtitle: "Tres pasos chicos, posibles desde hoy.",
            body: "",
            visual: "steps",
            props: { s1: "Notá el patrón", s2: "Elegí una respuesta distinta", s3: "Repetila hasta que sea tuya", s4: "" },
          };
        case "proof":
          return {
            title: "Por qué importa",
            subtitle: benefit ? `Porque ${benefit} no llega de golpe: se construye con decisiones chicas.` : "No hace falta cambiar todo. Alcanza con cambiar algo y sostenerlo.",
            body: "",
            visual: "quote",
            props: { text: "Lo que repetís todos los días termina siendo quién sos.", author: f.name },
          };
      }
      break;
    case "motivacion":
      switch (role) {
        case "problem":
          return { title: "Sé que hoy cuesta", subtitle: problem || "Sentís que hacés todo y no avanzás.", body: "", visual: "none" };
        case "example":
          return {
            title: "Mirá de nuevo",
            subtitle: "Lo que hoy parece estancamiento muchas veces es base.",
            body: "",
            visual: "quote",
            props: { text: "Lo que no se ve también es progreso.", author: f.name },
          };
        case "how":
          return {
            title: "Hoy alcanza con esto",
            subtitle: "Un paso chico. Uno solo.",
            body: "",
            visual: "checklist",
            props: { items: "Hacer 10 minutos de lo importante\nTomar agua y salir a caminar\nDescansar sin culpa" },
          };
        case "proof":
          return { title: "Recordá esto", subtitle: benefit ? `Vas camino a ${benefit}. Un día a la vez.` : "No tenés que poder con todo hoy.", body: "", visual: "none" };
      }
      break;
    case "proceso":
      switch (role) {
        case "problem":
          return { title: "Así arranqué", subtitle: problem || "[Contá dónde arrancaste, sin maquillar]", body: "", visual: imageStyle === "fotos" ? "photo" : "none" };
        case "example":
          return {
            title: "Lo que salió mal",
            subtitle: "Me equivoqué más de una vez. Este fue el error que más me enseñó:",
            body: "[Contá el error en una línea]",
            visual: "none",
          };
        case "how":
          return {
            title: "Lo que cambié",
            subtitle: "[La decisión que hizo la diferencia]",
            body: "",
            visual: "steps",
            props: { s1: "[Primer cambio]", s2: "[Segundo cambio]", s3: "[Lo que pasó después]", s4: "" },
          };
        case "proof":
          return {
            title: "Dónde estoy hoy",
            subtitle: f.benefit ? `${cap(f.benefit)}.` : "[Contá dónde estás hoy, con honestidad]",
            body: "",
            visual: imageStyle === "fotos" ? "photo" : "none",
          };
      }
      break;
    case "habitos":
      switch (role) {
        case "problem":
          return { title: "Por qué abandonás", subtitle: problem || "Arrancás con un plan perfecto y a la semana ya no da.", body: "", visual: "none" };
        case "example":
          return {
            title: "Mirá la diferencia",
            subtitle: "No falta voluntad. Falta un sistema.",
            body: "",
            visual: "comparison",
            props: {
              leftTitle: "Plan perfecto",
              left: "Dos horas por día\nTodo a la vez\nDepende de las ganas",
              rightTitle: "Sistema simple",
              right: "Diez minutos fijos\nUn hábito por vez\nDepende de la rutina",
            },
          };
        case "how":
          return {
            title: "El sistema",
            subtitle: "Tres pasos para que el hábito no dependa de la motivación.",
            body: "",
            visual: "steps",
            props: { s1: "Elegí un solo hábito", s2: "Atalo a algo que ya hacés", s3: "Registralo cada día", s4: "" },
          };
        case "proof":
          return {
            title: "Por qué funciona",
            subtitle: "Cuando la acción es chica y tiene un momento fijo, no dependés de las ganas.",
            body: "",
            visual: "quote",
            props: { text: "Lo pequeño, repetido, se vuelve grande.", author: f.name },
          };
      }
      break;
  }
  return { title: "", subtitle: "", body: "", visual: "none" };
}
