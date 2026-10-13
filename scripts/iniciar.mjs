/**
 * Iniciador local de Reputación OS (lo usa iniciar.bat).
 *
 * Hace todo lo necesario para ver la web en esta computadora, sin instalar
 * PostgreSQL ni Docker:
 *   1. Arranca un PostgreSQL incluido en node_modules (datos en ./.datos).
 *   2. Crea el rol de la app (sin privilegios para saltear el aislamiento) y la base.
 *   3. Crea el archivo .env si no existe.
 *   4. Aplica las migraciones.
 *   5. La primera vez: crea el superadministrador y el negocio DEMO,
 *      y guarda las claves en CREDENCIALES.txt.
 *   6. Compila la web si hace falta, la inicia y abre el navegador.
 *
 * Usa pg_ctl (y no postgres directamente) porque en Windows pg_ctl quita
 * los permisos de administrador por su cuenta: PostgreSQL no corre como administrador.
 */
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, ".datos");
const PG_DIR = path.join(DATA_DIR, "postgres");
const PG_LOG = path.join(DATA_DIR, "postgres.log");
const SECRETS_FILE = path.join(DATA_DIR, "secretos.json");
const ENV_FILE = path.join(ROOT, ".env");
const CREDENTIALS_FILE = path.join(ROOT, "CREDENCIALES.txt");
const PG_PORT = 5544;
const IS_WIN = process.platform === "win32";

const paso = (n, texto) => console.log(`\n[${n}/6] ${texto}`);
const ok = (texto) => console.log(`      ✔ ${texto}`);

function fallar(mensaje, detalle) {
  console.error(`\n✘ ${mensaje}`);
  if (detalle) console.error(String(detalle).trim().split("\n").slice(-15).join("\n"));
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf-8", windowsHide: true, ...opts });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? r.error.message : ""}` };
}

// Las herramientas se ejecutan directamente con Node (sin pasar por la consola de
// Windows): más robusto y sin el aviso DEP0190.
const BIN = {
  next: path.join(ROOT, "node_modules", "next", "dist", "bin", "next"),
  prisma: path.join(ROOT, "node_modules", "prisma", "build", "index.js"),
  tsx: path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"),
};

/** Ejecuta un script del proyecto (TypeScript) como lo hace "npm run". */
function runScript(file, args, opts = {}) {
  return run(process.execPath, [BIN.tsx, "--conditions=react-server", file, ...args], opts);
}

function secret(bytes = 18) {
  return randomBytes(bytes).toString("base64url");
}

function readSecrets() {
  if (fs.existsSync(SECRETS_FILE)) return JSON.parse(fs.readFileSync(SECRETS_FILE, "utf-8"));
  const s = { pgAdminPassword: secret(), appDbPassword: secret(), appSecret: secret(32) };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(s, null, 2));
  return s;
}

async function postgresBinaries() {
  const pkg = `@embedded-postgres/${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`;
  try {
    return await import(pkg);
  } catch {
    fallar(`No se encontró PostgreSQL para este sistema (${pkg}). Ejecutá "npm install" de nuevo.`);
  }
}

function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "127.0.0.1");
  });
}

async function startPostgres(bin, secrets) {
  if (!fs.existsSync(path.join(PG_DIR, "PG_VERSION"))) {
    const pwFile = path.join(os.tmpdir(), `ros-pg-${secret(6)}`);
    fs.writeFileSync(pwFile, `${secrets.pgAdminPassword}\n`);
    const r = run(bin.initdb, [
      `--pgdata=${PG_DIR}`, "--username=postgres", `--pwfile=${pwFile}`,
      "--auth=scram-sha-256", "--encoding=UTF8", "--locale=C",
    ]);
    fs.rmSync(pwFile, { force: true });
    if (r.code !== 0) fallar("No se pudo crear la base de datos local.", r.out);
    ok("Base de datos creada en la carpeta .datos");
  }
  const status = run(bin.pg_ctl, ["-D", PG_DIR, "status"]);
  if (status.code === 0) {
    ok("PostgreSQL ya estaba en marcha");
    return;
  }
  if (!(await portFree(PG_PORT))) fallar(`El puerto ${PG_PORT} está ocupado por otro programa. Cerralo y volvé a intentar.`);
  console.log("      Iniciando PostgreSQL…");
  // stdio "ignore": en Windows el proceso postgres hereda las tuberías de pg_ctl
  // y, si fueran "pipe", Node esperaría para siempre a que se cierren.
  // La salida queda en .datos/postgres.log.
  const r = spawnSync(
    bin.pg_ctl,
    ["-D", PG_DIR, "-l", PG_LOG, "-w", "-t", "60", "-o", `-p ${PG_PORT} -c listen_addresses=localhost`, "start"],
    { cwd: ROOT, stdio: "ignore", timeout: 90_000, windowsHide: true },
  );
  if (r.status !== 0) {
    const log = fs.existsSync(PG_LOG) ? fs.readFileSync(PG_LOG, "utf-8") : "";
    fallar("No se pudo iniciar PostgreSQL.", `${r.error?.message ?? ""}\n${log}`);
  }
  ok(`PostgreSQL iniciado (puerto ${PG_PORT})`);
}

async function ensureAppDatabase(secrets) {
  const client = new pg.Client({ host: "localhost", port: PG_PORT, user: "postgres", password: secrets.pgAdminPassword, database: "postgres" });
  await client.connect();
  try {
    const role = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'reputacion'");
    // Contraseña generada localmente (base64url): segura para interpolar.
    if (role.rowCount === 0) {
      await client.query(`CREATE ROLE reputacion LOGIN PASSWORD '${secrets.appDbPassword}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`);
    } else {
      await client.query(`ALTER ROLE reputacion WITH LOGIN PASSWORD '${secrets.appDbPassword}' NOSUPERUSER NOBYPASSRLS`);
    }
    const db = await client.query("SELECT 1 FROM pg_database WHERE datname = 'reputacion'");
    if (db.rowCount === 0) await client.query("CREATE DATABASE reputacion OWNER reputacion");
  } finally {
    await client.end();
  }
  ok("Usuario y base de la app listos");
}

function databaseUrl(secrets) {
  return `postgresql://reputacion:${secrets.appDbPassword}@localhost:${PG_PORT}/reputacion?schema=public`;
}

function ensureEnvFile(secrets) {
  const url = databaseUrl(secrets);
  if (!fs.existsSync(ENV_FILE)) {
    const template = fs.readFileSync(path.join(ROOT, ".env.example"), "utf-8");
    const content = template
      .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${url}"`)
      .replace(/^APP_SECRET=.*$/m, `APP_SECRET="${secrets.appSecret}"`)
      .replace(/^TRUST_PROXY=.*$/m, 'TRUST_PROXY="false"');
    fs.writeFileSync(ENV_FILE, content);
    ok("Archivo .env creado");
  } else {
    ok("Archivo .env existente (se usa la base local de .datos)");
  }
  return url;
}

async function countUsers(url) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return Number((await client.query("SELECT COUNT(*)::int AS n FROM users")).rows[0].n);
  } finally {
    await client.end();
  }
}

function newestMtime(dir) {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    newest = Math.max(newest, entry.isDirectory() ? newestMtime(p) : fs.statSync(p).mtimeMs);
  }
  return newest;
}

function needsBuild() {
  const buildId = path.join(ROOT, ".next", "BUILD_ID");
  if (!fs.existsSync(buildId)) return true;
  const built = fs.statSync(buildId).mtimeMs;
  return [path.join(ROOT, "src"), path.join(ROOT, "prisma")].some((d) => newestMtime(d) > built);
}

function openBrowser(url) {
  if (IS_WIN) spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  else if (process.platform === "darwin") spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  else spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).on("error", () => {}).unref();
}

/**
 * Dirección de esta computadora en la red local (WiFi/cable), para abrir la web
 * desde un celular conectado a la misma red. Prefiere rangos privados y evita
 * adaptadores virtuales (WSL, Hyper-V, VirtualBox, VMware, Docker).
 */
function lanAddress() {
  const virtual = /vethernet|virtualbox|vmware|wsl|hyper-v|docker|loopback|vbox|tailscale|zerotier/i;
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family !== "IPv4" || a.internal || a.address.startsWith("169.254.")) continue;
      const isPrivate = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address);
      const score = (isPrivate ? 2 : 0) + (virtual.test(name) ? 0 : 1) + (a.address.startsWith("192.168.") ? 1 : 0);
      candidates.push({ address: a.address, score });
    }
  }
  candidates.sort((x, y) => y.score - x.score);
  return candidates[0]?.address ?? null;
}

async function printQr(url) {
  try {
    const QRCode = (await import("qrcode")).default;
    console.log(await QRCode.toString(url, { type: "terminal", small: true, errorCorrectionLevel: "L" }));
  } catch {
    /* si la consola no puede dibujarlo, alcanza con la dirección escrita */
  }
}

async function waitForHttp(url, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {
      /* todavía no responde */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  Reputación OS · inicio local");
  console.log("══════════════════════════════════════════");

  const secrets = readSecrets();
  const bin = await postgresBinaries();

  paso(1, "Base de datos");
  await startPostgres(bin, secrets);
  await ensureAppDatabase(secrets);

  paso(2, "Configuración");
  const dbUrl = ensureEnvFile(secrets);

  let appPort = 3000;
  while (!(await portFree(appPort)) && appPort < 3010) appPort++;
  const localUrl = `http://localhost:${appPort}`;
  // LOCAL_ONLY=1 desactiva el acceso desde otros dispositivos de la red.
  const lanIp = process.env.LOCAL_ONLY === "1" ? null : lanAddress();
  const lanUrl = lanIp ? `http://${lanIp}:${appPort}` : null;
  // APP_URL define a dónde apuntan los QR que se descargan del panel: con la
  // dirección de la red, funcionan desde cualquier celular conectado a la misma WiFi.
  const appUrl = lanUrl ?? localUrl;
  // Las variables del proceso tienen prioridad sobre .env.
  const env = { ...process.env, DATABASE_URL: dbUrl, APP_URL: appUrl };
  delete env.NODE_ENV; // next build/start lo definen solos

  paso(3, "Migraciones");
  const mig = run(process.execPath, [BIN.prisma, "migrate", "deploy"], { env });
  if (mig.code !== 0) fallar("Fallaron las migraciones.", mig.out);
  ok("Esquema actualizado");

  paso(4, "Usuarios");
  if ((await countUsers(dbUrl)) === 0) {
    const adminEmail = "admin@reputacion.local";
    const adminPassword = secret(9);
    const demoPassword = secret(9);
    const a = runScript("scripts/create-superadmin.ts", ["--email", adminEmail, "--password", adminPassword], { env });
    if (a.code !== 0) fallar("No se pudo crear el superadministrador.", a.out);
    const d = runScript("scripts/seed-demo.ts", [], { env: { ...env, DEMO_PASSWORD: demoPassword } });
    if (d.code !== 0) fallar("No se pudo crear el negocio de demostración.", d.out);
    fs.writeFileSync(
      CREDENTIALS_FILE,
      [
        "REPUTACIÓN OS · ACCESOS LOCALES",
        "(Guardá este archivo en un lugar seguro. Solo sirve en esta computadora.)",
        "",
        `Ingreso desde esta computadora: ${localUrl}/login`,
        "Desde el celular (misma WiFi): usá la dirección que muestra la ventana de iniciar.bat.",
        "",
        "Superadministrador (panel maestro)",
        `  Email:      ${adminEmail}`,
        `  Contraseña: ${adminPassword}`,
        "",
        "Dueño del negocio DEMO (Café La Esquina)",
        "  Email:      demo@reputacion-os.local",
        `  Contraseña: ${demoPassword}`,
        "",
        `Página pública demo: ${localUrl}/r/demo-cafe-la-esquina`,
        "",
      ].join("\r\n"),
    );
    ok("Superadministrador y negocio DEMO creados");
  } else {
    ok("Usuarios existentes");
  }

  paso(5, "Compilación");
  if (needsBuild()) {
    console.log("      Compilando la web. La primera vez puede tardar varios minutos (más si el antivirus revisa los archivos).");
    console.log("      Vas a ver el avance acá abajo:\n");
    // Salida visible en vivo: así se nota que avanza y, si falla, se ve el motivo.
    const b = spawnSync(process.execPath, [BIN.next, "build"], {
      cwd: ROOT,
      env: { ...env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true,
    });
    if (b.status !== 0) fallar("Falló la compilación (ver el detalle arriba).");
    ok("Web compilada");
  } else {
    ok("Ya estaba compilada");
  }

  paso(6, "Iniciando");
  // -H 0.0.0.0: escucha también en la red local, no solo en esta computadora.
  const server = spawn(process.execPath, [BIN.next, "start", "-p", String(appPort), "-H", lanUrl ? "0.0.0.0" : "localhost"], {
    cwd: ROOT,
    env: { ...env, NEXT_TELEMETRY_DISABLED: "1" },
    // La salida normal se descarta (si se capturara sin leerla, podría frenar el servidor);
    // los errores se muestran en la ventana.
    stdio: ["ignore", "ignore", "inherit"],
    windowsHide: true,
  });
  server.on("exit", (code) => {
    stopPostgres(bin);
    process.exit(code ?? 0);
  });

  const stop = () => {
    console.log("\nCerrando…");
    server.kill();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  if (!(await waitForHttp(`${localUrl}/login`, 60_000))) fallar("La web no respondió a tiempo.");
  console.log("\n══════════════════════════════════════════");
  console.log(`  ✔ Listo`);
  console.log(`  En esta computadora:  ${localUrl}/login`);
  if (lanUrl) {
    console.log(`  Desde el celular:     ${lanUrl}`);
    console.log("  (el celular tiene que estar conectado a la MISMA WiFi que esta computadora)");
  }
  console.log(`  Usuarios y contraseñas: ${CREDENTIALS_FILE}`);
  console.log("  Para cerrar: Ctrl+C o cerrá esta ventana.");
  console.log("══════════════════════════════════════════\n");
  if (lanUrl) {
    console.log("  Escaneá este QR con el celular para abrir la página pública de la demo:\n");
    await printQr(`${lanUrl}/r/demo-cafe-la-esquina`);
    if (IS_WIN) {
      console.log("  Si el celular no abre la página: cuando Windows pregunte, permití el acceso de");
      console.log('  "Node.js" en redes PRIVADAS (o revisá el Firewall de Windows).\n');
    }
  }
  openBrowser(`${localUrl}/login`);
}

function stopPostgres(bin) {
  run(bin.pg_ctl, ["-D", PG_DIR, "-m", "fast", "stop"]);
}

main().catch((e) => fallar("Error inesperado.", e?.stack ?? e));
