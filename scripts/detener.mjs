/** Detiene el PostgreSQL local de .datos (lo usa detener.bat). */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PG_DIR = path.join(ROOT, ".datos", "postgres");
if (!fs.existsSync(PG_DIR)) {
  console.log("No hay base de datos local creada.");
  process.exit(0);
}
const pkg = `@embedded-postgres/${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`;
const { pg_ctl } = await import(pkg);
const r = spawnSync(pg_ctl, ["-D", PG_DIR, "-m", "fast", "stop"], { encoding: "utf-8" });
console.log(r.status === 0 ? "✔ Base de datos detenida." : "La base de datos ya estaba detenida.");
