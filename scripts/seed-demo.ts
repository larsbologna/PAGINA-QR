/**
 * Crea el negocio de DEMOSTRACIÓN "Café La Esquina" con opiniones ficticias.
 *
 *   npm run demo:seed
 *   DEMO_PASSWORD="otra-clave-demo" npm run demo:seed
 *
 * - Solo crea/recrea el negocio de demo (isDemo = true). No toca datos reales.
 * - En producción se niega a correr salvo ALLOW_DEMO_SEED=true.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/server/db";
import { seedDemo, DEMO_SLUG } from "@/server/demo";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("En producción, el modo demo requiere ALLOW_DEMO_SEED=true de forma explícita.");
  }
  const password = process.env.DEMO_PASSWORD || randomBytes(12).toString("base64url");
  if (password.length < 10) throw new Error("DEMO_PASSWORD debe tener al menos 10 caracteres.");
  const r = await seedDemo({ password });
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  console.log("✔ Demo lista (datos ficticios, marcados como DEMO)");
  console.log(`  Opiniones generadas: ${r.feedbackCount}`);
  console.log(`  Página pública: ${appUrl}/r/${DEMO_SLUG}`);
  console.log(`  Panel:          ${appUrl}/login`);
  console.log(`  Usuario demo:   ${r.email}`);
  console.log(`  Contraseña:     ${password}${process.env.DEMO_PASSWORD ? " (de DEMO_PASSWORD)" : " (generada, guardala)"}`);
}

main()
  .catch((e) => {
    console.error("✘", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
