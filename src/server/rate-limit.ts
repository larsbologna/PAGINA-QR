import "server-only";
import { prisma } from "./db";
import { keyedHash } from "./crypto";

/**
 * Limitador de ventana fija persistido en PostgreSQL (funciona con varias
 * instancias/serverless). Devuelve true si la acción está permitida.
 */
export async function consumeRateLimit(scope: string, identifier: string, limit: number, windowMs: number): Promise<boolean> {
  const key = keyedHash(`${scope}:${identifier}`);
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limit_buckets" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "rate_limit_buckets"."count" + 1
    RETURNING "count"`;
  // Limpieza oportunista de ventanas viejas (barata gracias al índice).
  if (Math.random() < 0.02) {
    await prisma.rateLimitBucket.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } });
  }
  return (rows[0]?.count ?? 1) <= limit;
}
