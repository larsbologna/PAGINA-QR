import "server-only";
import { randomUUID } from "node:crypto";
import { PNG } from "pngjs";
import { prisma } from "./db";
import { withSystem } from "./tenant";
import { createBusiness } from "./services/businesses";
import { hashPassword } from "./auth/password";

export const DEMO_SLUG = "demo-cafe-la-esquina";
export const DEMO_EMAIL = "demo@reputacion-os.local";

/** PRNG determinista: la demo siempre genera los mismos datos. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Logo de ejemplo dibujado por código (taza de café), sin archivos externos. */
export function demoLogoPng(size = 256): Buffer {
  const png = new PNG({ width: size, height: size });
  const bg = [15, 118, 110], fg = [255, 255, 255];
  const s = size / 256;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const X = x / s, Y = y / s;
      // Fondo redondeado
      const r = 48;
      const cx = Math.min(Math.max(X, r), 256 - r), cy = Math.min(Math.max(Y, r), 256 - r);
      const inBg = (X - cx) ** 2 + (Y - cy) ** 2 <= r * r;
      let color: number[] | null = inBg ? bg : null;
      // Taza
      const cup = X >= 70 && X <= 166 && Y >= 104 && Y <= 186 && !(Y > 170 && (X < 70 + (Y - 170) || X > 166 - (Y - 170)));
      const handleD = Math.hypot(X - 168, Y - 138);
      const handle = handleD >= 16 && handleD <= 28 && X > 166;
      const plate = Y >= 194 && Y <= 204 && X >= 56 && X <= 200;
      const steam = [92, 118, 144].some((sx) => Y >= 58 && Y <= 92 && Math.abs(X - (sx + 6 * Math.sin((Y - 58) / 6))) <= 4);
      if (inBg && (cup || handle || plate || steam)) color = fg;
      const i = (y * size + x) * 4;
      if (color) {
        png.data[i] = color[0]!; png.data[i + 1] = color[1]!; png.data[i + 2] = color[2]!; png.data[i + 3] = 255;
      } else {
        png.data[i + 3] = 0;
      }
    }
  }
  return PNG.sync.write(png);
}

const COMMENTS: Record<number, string[]> = {
  5: [
    "Excelente atención, el café riquísimo. Volvemos seguro.",
    "Las medialunas son las mejores del barrio.",
    "Muy buena onda del personal y todo impecable.",
    "Me encantó el lugar, ideal para trabajar un rato.",
    "Todo perfecto, gracias!",
    "",
  ],
  4: [
    "Muy rico todo, solo tardaron un poco en traer la cuenta.",
    "Buen café y precio razonable.",
    "Lindo lugar, un poco ruidoso al mediodía.",
    "Buena atención. Sumaría opciones sin TACC.",
    "",
  ],
  3: [
    "Correcto, nada especial. El café estaba tibio.",
    "Tardaron bastante en tomar el pedido.",
    "La comida bien pero el baño no estaba limpio.",
    "Precio algo elevado para lo que es.",
    "",
  ],
  2: [
    "Esperamos más de 30 minutos por dos cafés.",
    "La mesa estaba sucia y nadie vino a limpiarla.",
    "El tostado llegó frío.",
    "Caro para la porción que sirven.",
  ],
  1: [
    "Pésima espera, nos fuimos sin que nos atendieran.",
    "Mala atención de la persona de la caja.",
    "Encontramos un pelo en la comida.",
  ],
};

/** Contactos ficticios (números 555 y dominio .example, que no existen). */
const DEMO_CONTACTS = [
  { contactName: "Laura (DEMO)", contactPhone: "11 5555-0101", contactEmail: null },
  { contactName: "Martín (DEMO)", contactPhone: null, contactEmail: "martin@correo.example" },
  { contactName: null, contactPhone: "11 5555-0199", contactEmail: null },
  { contactName: "Sofía (DEMO)", contactPhone: "11 5555-0142", contactEmail: "sofia@correo.example" },
];

const CATEGORY_HINTS: Record<number, string[]> = {
  5: ["Atención", "Calidad de la comida", "Ambiente"],
  4: ["Calidad de la comida", "Atención", "Precio", "Ambiente"],
  3: ["Tiempo de espera", "Precio", "Limpieza", "Calidad de la comida"],
  2: ["Tiempo de espera", "Limpieza", "Precio", "Calidad de la comida"],
  1: ["Tiempo de espera", "Atención", "Calidad de la comida"],
};

/**
 * Crea (o recrea) el negocio de demostración. Solo toca el negocio con
 * isDemo = true y el slug de demo: nunca modifica negocios reales.
 */
export async function seedDemo(opts: { password: string; days?: number; now?: Date }) {
  const days = opts.days ?? 120;
  const now = opts.now ?? new Date();
  const existing = await prisma.business.findUnique({ where: { slug: DEMO_SLUG } });
  if (existing && !existing.isDemo) throw new Error(`Ya existe un negocio REAL con el slug ${DEMO_SLUG}; no se modifica.`);
  if (existing) await withSystem((tx) => tx.business.delete({ where: { id: existing.id } }));

  const { business } = await createBusiness(
    {
      name: "Café La Esquina",
      slug: DEMO_SLUG,
      industry: "restaurante",
      plan: "PROFESIONAL",
      googleReviewUrl: "https://www.google.com/maps/search/?api=1&query=caf%C3%A9",
      isDemo: true,
    },
    null,
  );
  await prisma.business.update({
    where: { id: business.id },
    data: {
      brandColor: "#0f766e",
      welcomeMessage: "¿Cómo fue tu experiencia en Café La Esquina?",
      logoData: new Uint8Array(demoLogoPng()),
      logoMimeType: "image/png",
      logoUpdatedAt: now,
      internalNotes: "Negocio de demostración. Datos ficticios.",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { email: DEMO_EMAIL, name: "Dueño Demo", passwordHash: await hashPassword(opts.password) },
    update: { passwordHash: await hashPassword(opts.password), isActive: true, role: "USER" },
  });
  await prisma.businessMember.create({ data: { userId: user.id, businessId: business.id, role: "OWNER" } });

  const rand = mulberry32(20261010);
  let count = 0;
  await withSystem(async (tx) => {
    const cats = await tx.feedbackCategory.findMany({ where: { businessId: business.id } });
    const byName = new Map(cats.map((c) => [c.name, c.id]));
    for (let d = days; d >= 0; d--) {
      const perDay = Math.floor(rand() * 3) + (d % 7 === 5 || d % 7 === 6 ? 2 : 0);
      // La espera mejora en el último mes (para que la demo muestre una tendencia real).
      const improving = d < 30;
      for (let k = 0; k < perDay; k++) {
        const r = rand();
        const rating = improving
          ? r < 0.5 ? 5 : r < 0.78 ? 4 : r < 0.9 ? 3 : r < 0.96 ? 2 : 1
          : r < 0.36 ? 5 : r < 0.6 ? 4 : r < 0.75 ? 3 : r < 0.9 ? 2 : 1;
        const pool = COMMENTS[rating]!;
        const comment = pool[Math.floor(rand() * pool.length)]!;
        const hints = CATEGORY_HINTS[rating]!;
        const nCats = rand() < 0.25 ? 0 : rand() < 0.7 ? 1 : 2;
        const chosen = [...new Set(Array.from({ length: nCats }, () => hints[Math.floor(rand() * hints.length)]!))]
          .map((n) => byName.get(n))
          .filter((x): x is string => !!x);
        const createdAt = new Date(now.getTime() - d * 86400000 - Math.floor(rand() * 10 * 3600000));
        const contact = rating <= 4 && rand() < 0.3 ? DEMO_CONTACTS[Math.floor(rand() * DEMO_CONTACTS.length)]! : null;
        const status = d > 14 && rand() < 0.85 ? "REVIEWED" : rating <= 3 && d >= 2 && rand() < 0.5 ? "IN_PROGRESS" : "NEW";
        const fb = await tx.feedback.create({
          data: {
            businessId: business.id,
            rating,
            comment: comment || null,
            submissionKey: randomUUID(),
            createdAt,
            status,
            reviewedAt: status === "REVIEWED" ? createdAt : null,
            ...(contact ? { ...contact, contactConsentAt: createdAt } : {}),
          },
        });
        if (chosen.length) {
          await tx.feedbackCategorySelection.createMany({ data: chosen.map((categoryId) => ({ feedbackId: fb.id, categoryId, businessId: business.id })) });
        }
        // Parte de quienes opinan también toca "Dejar reseña en Google" (más probable si quedaron contentos).
        if (rand() < (rating >= 4 ? 0.45 : 0.12)) {
          await tx.googleClick.create({ data: { businessId: business.id, createdAt } });
        }
        if (rating <= 2 && rand() < 0.4) {
          await tx.feedbackNote.create({
            data: { feedbackId: fb.id, businessId: business.id, authorId: user.id, body: "Lo hablamos en la reunión de equipo del lunes." },
          });
        }
        count++;
      }
    }
  });
  return { business, email: DEMO_EMAIL, feedbackCount: count };
}
