// Da de alta un negocio y la cuenta de su dueño (o vincula una cuenta existente).
// Usa el Admin SDK de Firebase, que no pasa por las reglas de seguridad: solo
// lo puede ejecutar quien tenga la clave privada de la cuenta de servicio.
//
//   node tools/crear-negocio.mjs --clave cuenta-servicio.json \
//     --slug cafe-la-esquina --nombre "Café La Esquina" --email duena@ejemplo.com \
//     [--password "una-clave-larga"] [--rubro Cafetería] [--direccion "Av. Siempreviva 742"] [--google https://g.page/r/…/review]
//
// Opciones extra: --suspender / --activar (pausa o reanuda la página pública).
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { checkGoogleUrl } from "../web/src/lib/google-url.js";
import { SLUG_RE } from "../web/src/lib/feedback.js";

const { values: a } = parseArgs({
  options: {
    clave: { type: "string" },
    proyecto: { type: "string" },
    slug: { type: "string" },
    nombre: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
    rubro: { type: "string", default: "" },
    direccion: { type: "string", default: "" },
    google: { type: "string" },
    suspender: { type: "boolean", default: false },
    activar: { type: "boolean", default: false },
  },
});

const fail = (m) => {
  console.error(`✖ ${m}`);
  process.exit(1);
};

const emulated = !!process.env.FIRESTORE_EMULATOR_HOST;
if (!a.clave && !emulated) fail("Falta --clave <archivo.json> (Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada).");
const key = a.clave ? JSON.parse(readFileSync(a.clave, "utf8")) : null;
initializeApp(key ? { credential: cert(key), projectId: key.project_id } : { projectId: a.proyecto ?? process.env.GCLOUD_PROJECT ?? "demo-pagina-qr" });
const db = getFirestore();
const auth = getAuth();

const slug = String(a.slug ?? "").trim().toLowerCase();
if (!SLUG_RE.test(slug)) fail("--slug inválido: usá minúsculas, números y guiones (ej.: cafe-la-esquina).");
const ref = db.doc(`businesses/${slug}`);

if (a.suspender || a.activar) {
  if (!(await ref.get()).exists) fail(`No existe el negocio ${slug}.`);
  await ref.update({ active: !a.suspender, updatedAt: FieldValue.serverTimestamp() });
  console.log(`✔ ${slug}: página pública ${a.suspender ? "suspendida" : "activa"}.`);
  process.exit(0);
}

const name = String(a.nombre ?? "").trim();
if (name.length < 2 || name.length > 80) fail("--nombre es obligatorio (2 a 80 caracteres).");
const email = String(a.email ?? "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("--email inválido.");
let google = null;
if (a.google) {
  const r = checkGoogleUrl(a.google);
  if (!r.ok) fail(`--google: ${r.error}`);
  google = r.url;
}
if (a.password && a.password.length < 10) fail("--password debe tener al menos 10 caracteres.");

let user;
let password = null;
try {
  user = await auth.getUserByEmail(email);
  console.log(`• La cuenta ${email} ya existe: se vincula al negocio (su contraseña no cambia).`);
} catch (e) {
  if (e.code !== "auth/user-not-found") throw e;
  password = a.password ?? randomBytes(12).toString("base64url");
  user = await auth.createUser({ email, password, emailVerified: false });
}

const exists = (await ref.get()).exists;
if (exists) {
  await ref.update({ name, industry: a.rubro.slice(0, 60), address: a.direccion.slice(0, 160), ...(google ? { googleReviewUrl: google } : {}), updatedAt: FieldValue.serverTimestamp() });
} else {
  await ref.set({ name, industry: a.rubro.slice(0, 60), address: a.direccion.slice(0, 160), logo: null, googleReviewUrl: google, active: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
}
await db.doc(`access/${slug}`).set({ ownerUids: FieldValue.arrayUnion(user.uid) }, { merge: true });

console.log(`✔ Negocio ${exists ? "actualizado" : "creado"}: ${name} (${slug})`);
console.log(`  Dueño: ${email}${password ? `  ·  contraseña: ${password}  (se muestra una sola vez)` : ""}`);
console.log(`  Enlace del QR: <URL de la web>?c=${slug}`);
process.exit(0);
