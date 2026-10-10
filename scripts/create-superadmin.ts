/**
 * Crea (o promueve) el primer superadministrador.
 *
 *   npm run superadmin:create -- --email vos@tu-dominio.com
 *   npm run superadmin:create -- --email vos@tu-dominio.com --password "una-clave-larga"
 *
 * Si no indicás contraseña (ni SUPERADMIN_PASSWORD), se genera una aleatoria y se
 * muestra UNA sola vez en la terminal.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { emailSchema, passwordSchema } from "@/lib/validation";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = emailSchema.parse(arg("email") ?? process.env.SUPERADMIN_EMAIL ?? "");
  let password = arg("password") ?? process.env.SUPERADMIN_PASSWORD;
  const generated = !password;
  if (!password) password = randomBytes(15).toString("base64url");
  passwordSchema.parse(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "SUPERADMIN", isActive: true, ...(arg("password") || process.env.SUPERADMIN_PASSWORD ? { passwordHash: await hashPassword(password) } : {}) },
    });
    console.log(`✔ ${email} ahora es superadministrador.`);
    if (generated) console.log("  (Se mantuvo su contraseña actual.)");
  } else {
    await prisma.user.create({ data: { email, role: "SUPERADMIN", passwordHash: await hashPassword(password) } });
    console.log(`✔ Superadministrador creado: ${email}`);
    if (generated) console.log(`  Contraseña generada (guardala ahora, no se vuelve a mostrar): ${password}`);
  }
  console.log("  Ingresá en /login");
}

main()
  .catch((e) => {
    console.error("✘", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
