// Almacenamiento del MODO DEMO: todo vive en el navegador (localStorage).
// Sirve para mostrar el producto sin configurar Firebase. No comparte datos
// entre dispositivos.
const KEY = "reputacion-os-demo-v1";
const SESSION = "reputacion-os-demo-session";
export const DEMO_SLUG = "demo-cafe-la-esquina";

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMMENTS = {
  5: ["Excelente atención, el café riquísimo.", "Las medialunas son las mejores del barrio.", "Todo perfecto, gracias!", ""],
  4: ["Muy rico todo, solo tardaron un poco en traer la cuenta.", "Buen café y precio razonable.", "Lindo lugar, un poco ruidoso al mediodía.", ""],
  3: ["Correcto, nada especial. El café estaba tibio.", "Tardaron bastante en tomar el pedido.", "Precio algo elevado para lo que es."],
  2: ["Esperamos más de 30 minutos por dos cafés.", "La mesa estaba sucia y nadie vino a limpiarla.", "El tostado llegó frío."],
  1: ["Pésima espera, nos fuimos sin que nos atendieran.", "Mala atención en la caja."],
};
const REASONS = {
  4: ["Calidad de la comida", "Precio", "Ambiente"],
  3: ["Tiempo de espera", "Precio", "Limpieza"],
  2: ["Tiempo de espera", "Limpieza", "Calidad de la comida"],
  1: ["Tiempo de espera", "Atención"],
};
const CONTACTS = [
  { consent: true, name: "Laura (DEMO)", phone: "11 5555-0101", email: "" },
  { consent: true, name: "Martín (DEMO)", phone: "", email: "martin@correo.example" },
];

function seed() {
  const rand = mulberry32(20261013);
  const now = Date.now();
  const feedback = [];
  const clicks = {};
  for (let d = 120; d >= 0; d--) {
    const perDay = Math.floor(rand() * 3) + (d % 7 >= 5 ? 1 : 0);
    for (let k = 0; k < perDay; k++) {
      const r = rand();
      const rating = d < 30 ? (r < 0.5 ? 5 : r < 0.78 ? 4 : r < 0.9 ? 3 : r < 0.96 ? 2 : 1) : r < 0.36 ? 5 : r < 0.6 ? 4 : r < 0.75 ? 3 : r < 0.9 ? 2 : 1;
      const createdAt = new Date(now - d * 86400000 - Math.floor(rand() * 10 * 3600000));
      const day = createdAt.toISOString().slice(0, 10);
      if (rating === 5) {
        clicks[day] = (clicks[day] ?? 0) + (rand() < 0.7 ? 1 : 0);
      }
      const pool = COMMENTS[rating];
      const reasons = REASONS[rating] ?? [];
      const item = {
        id: `demo-${d}-${k}`,
        rating,
        comment: pool[Math.floor(rand() * pool.length)],
        categories: rating < 5 && rand() < 0.8 ? [reasons[Math.floor(rand() * reasons.length)]] : [],
        status: d > 14 && rand() < 0.85 ? "REVIEWED" : rating <= 3 && d >= 2 && rand() < 0.5 ? "IN_PROGRESS" : "NEW",
        createdAt: createdAt.toISOString(),
      };
      if (rating <= 3 && rand() < 0.3) item.contact = CONTACTS[Math.floor(rand() * CONTACTS.length)];
      feedback.push(item);
    }
  }
  return {
    businesses: {
      [DEMO_SLUG]: {
        name: "Café La Esquina",
        brandColor: "#0f766e",
        logo: null,
        welcomeMessage: "¿Cómo fue tu experiencia en Café La Esquina?",
        thankYouMessage: "¡Gracias por tomarte un momento para contarnos!",
        googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=caf%C3%A9",
        categories: ["Atención", "Calidad de la comida", "Tiempo de espera", "Limpieza", "Precio", "Ambiente", "Otro"],
        active: true,
        isDemo: true,
        createdAt: new Date(now - 120 * 86400000).toISOString(),
      },
    },
    access: { [DEMO_SLUG]: { ownerUids: ["demo"], ownerEmails: ["demo@reputacion-os.local"] } },
    feedback: { [DEMO_SLUG]: feedback },
    clicks: { [DEMO_SLUG]: clicks },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* navegador sin almacenamiento: se usa la semilla en memoria */
  }
  const data = seed();
  save(data);
  return data;
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export function createDemoStore() {
  let data = load();
  const listeners = new Set();
  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem(SESSION) ?? "null");
  } catch {
    user = null;
  }
  const emit = () => listeners.forEach((fn) => fn(user));
  const commit = () => save(data);

  return {
    mode: "demo",
    onAuth(fn) {
      listeners.add(fn);
      fn(user);
      return () => listeners.delete(fn);
    },
    currentUser: () => user,
    async signIn() {
      user = { uid: "demo", email: "demo@reputacion-os.local" };
      sessionStorage.setItem(SESSION, JSON.stringify(user));
      emit();
    },
    async signOut() {
      user = null;
      sessionStorage.removeItem(SESSION);
      emit();
    },
    async resetPassword() {
      throw new Error("En el modo demo no hay contraseñas: usá «Entrar a la demo».");
    },
    async isAdmin() {
      return !!user;
    },
    async getBusiness(slug) {
      return data.businesses[slug] ?? null;
    },
    async submitFeedback(slug, input) {
      const b = data.businesses[slug];
      if (!b || !b.active) throw new Error("Este comercio no está recibiendo opiniones.");
      (data.feedback[slug] ??= []).push({ id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...input, status: "NEW", createdAt: new Date().toISOString() });
      commit();
    },
    async recordGoogleClick(slug) {
      const day = new Date().toISOString().slice(0, 10);
      const c = (data.clicks[slug] ??= {});
      c[day] = (c[day] ?? 0) + 1;
      commit();
    },
    async myBusinesses() {
      return Object.entries(data.businesses).map(([slug, b]) => ({ slug, ...b }));
    },
    async listBusinesses() {
      return this.myBusinesses();
    },
    async listFeedback(slug) {
      return [...(data.feedback[slug] ?? [])].map((f) => ({ ...f, createdAt: new Date(f.createdAt) })).sort((a, b) => b.createdAt - a.createdAt);
    },
    async setStatus(slug, id, status) {
      const f = data.feedback[slug]?.find((x) => x.id === id);
      if (f) f.status = status;
      commit();
    },
    async setNote(slug, id, note) {
      const f = data.feedback[slug]?.find((x) => x.id === id);
      if (f) f.note = note;
      commit();
    },
    async getClicks(slug) {
      return Object.entries(data.clicks[slug] ?? {}).map(([day, count]) => ({ day, count }));
    },
    async saveBusiness(slug, profile, { isNew = false } = {}) {
      if (isNew && data.businesses[slug]) throw new Error("Ya existe un comercio con ese identificador.");
      data.businesses[slug] = { ...(data.businesses[slug] ?? { createdAt: new Date().toISOString(), isDemo: true }), ...profile };
      if (isNew) data.access[slug] = { ownerUids: [], ownerEmails: [] };
      commit();
    },
    async getAccess(slug) {
      return data.access[slug] ?? { ownerUids: [], ownerEmails: [] };
    },
    async createOwner(slug, email) {
      const a = (data.access[slug] ??= { ownerUids: [], ownerEmails: [] });
      if (!a.ownerEmails.includes(email)) a.ownerEmails.push(email);
      commit();
    },
    /** Vuelve a los datos de ejemplo originales. */
    reset() {
      data = seed();
      commit();
    },
  };
}
