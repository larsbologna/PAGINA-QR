/**
 * Elimina las opiniones más antiguas que el plazo de conservación de cada negocio.
 * Programalo una vez por día (cron, tarea programada de tu proveedor, etc.):
 *   npm run retention:run
 */
import { prisma } from "@/server/db";
import { applyRetention } from "@/server/services/businesses";

applyRetention()
  .then((r) => {
    const total = r.reduce((a, x) => a + x.deleted, 0);
    console.log(`✔ Retención aplicada a ${r.length} negocios. Opiniones eliminadas: ${total}.`);
  })
  .catch((e) => {
    console.error("✘", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
