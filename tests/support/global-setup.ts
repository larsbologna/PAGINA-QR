import { execSync } from "node:child_process";

/** Aplica migraciones pendientes a la base de pruebas (no destructivo). */
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? "postgresql://reputacion:reputacion@localhost:5432/reputacion_test?schema=public";
  if (!/_test(\?|$)/.test(url.split("/").pop() ?? "")) throw new Error("La base de pruebas debe terminar en _test por seguridad.");
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
}
