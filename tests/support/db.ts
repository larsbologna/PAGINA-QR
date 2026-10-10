import { prisma } from "@/server/db";

export async function resetDb() {
  // Protección: solo se vacía una base cuyo nombre termina en _test.
  const [{ db }] = await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`;
  if (!db.endsWith("_test")) throw new Error(`resetDb se negó a vaciar la base "${db}"`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    "feedback_category_selections", "feedback_notes", "feedback", "feedback_categories",
    "business_slug_history", "business_members", "invitations", "business_plans",
    "audit_logs", "rate_limit_buckets", "sessions", "businesses", "users" CASCADE`);
}

export { prisma };
