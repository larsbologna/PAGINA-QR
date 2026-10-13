import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { E2E_DB } from "../../playwright.config";

export const SUPERADMIN = { email: "super@e2e.test", password: "super-clave-e2e-2026" };

/** Prepara la base E2E dedicada: migraciones, vaciado (solo *_e2e) y superadministrador. */
export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: E2E_DB };
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  const prisma = new PrismaClient({ datasourceUrl: E2E_DB });
  try {
    const [{ db }] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
    if (!db.endsWith("_e2e")) throw new Error(`Se esperaba una base *_e2e y se obtuvo "${db}". No se vacía.`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE feedback_category_selections, feedback_notes, feedback, feedback_categories,
      business_slug_history, business_members, invitations, business_plans, audit_logs, rate_limit_buckets, google_clicks, sessions, businesses, users CASCADE`);
  } finally {
    await prisma.$disconnect();
  }
  execSync(`npx tsx --conditions=react-server scripts/create-superadmin.ts --email ${SUPERADMIN.email} --password ${SUPERADMIN.password}`, {
    env,
    stdio: "pipe",
  });
}
