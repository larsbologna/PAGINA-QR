// Reglas de Firestore contra el emulador: npm run test:rules
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch, type Firestore } from "firebase/firestore";
import { applyFilter, computeStats, sentimentOf } from "../../web/src/lib/feedback.js";
import { checkGoogleUrl } from "../../web/src/lib/google-url.js";

let env: RulesTestEnvironment;

const profile = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  industry: "Cafetería",
  address: "",
  logo: null,
  googleReviewUrl: "https://g.page/r/test/review",
  active: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...extra,
});

let n = 0;
const fid = () => (++n).toString(16).padStart(24, "0");

/** Envío público: opinión + registro de límite en un mismo lote (como la web). */
function submit(db: Firestore, uid: string, slug: string, data: Record<string, unknown> = {}, id = fid()) {
  const b = writeBatch(db);
  b.set(doc(db, `businesses/${slug}/feedback/${id}`), { rating: 2, comment: "Tardaron mucho", uid, status: "pending", createdAt: serverTimestamp(), ...data });
  b.set(doc(db, `throttle/${uid}`), { at: serverTimestamp(), slug, fid: id });
  return b.commit();
}

const visitor = (uid = "visitante") => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore();
const owner = (uid: string) => env.authenticatedContext(uid, { email: `${uid}@test.com`, firebase: { sign_in_provider: "password" } }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-pagina-qr", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
});
afterAll(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "businesses/cafe-a"), profile("Café A"));
    await setDoc(doc(db, "businesses/cafe-b"), profile("Café B"));
    await setDoc(doc(db, "businesses/cerrado"), profile("Cerrado", { active: false }));
    await setDoc(doc(db, "access/cafe-a"), { ownerUids: ["duenoA"] });
    await setDoc(doc(db, "access/cafe-b"), { ownerUids: ["duenoB"] });
    await setDoc(doc(db, "businesses/cafe-a/feedback/fa"), { rating: 3, comment: "de A", uid: "x", status: "pending", createdAt: new Date() });
    await setDoc(doc(db, "businesses/cafe-b/feedback/fb"), { rating: 1, comment: "secreto de B", uid: "y", status: "pending", createdAt: new Date() });
  });
});

describe("pantalla pública", () => {
  it("cualquiera lee el perfil de un negocio, pero no puede listar negocios", async () => {
    await assertSucceeds(getDoc(doc(anon(), "businesses/cafe-a")));
    await assertFails(getDocs(collection(anon(), "businesses")));
  });

  it("un visitante (sesión anónima) deja una opinión de 1 a 5 estrellas", async () => {
    for (const rating of [1, 2, 3, 4]) await assertSucceeds(submit(visitor(`v${rating}`), `v${rating}`, "cafe-a", { rating }));
    await assertSucceeds(submit(visitor("v5"), "v5", "cafe-a", { rating: 5, comment: "" }));
  });

  it("sin sesión no se puede opinar", async () => {
    await assertFails(submit(anon(), "nadie", "cafe-a"));
  });

  it("rechaza puntuaciones inválidas, campos extra, estados falsos y otro uid", async () => {
    await assertFails(submit(visitor(), "visitante", "cafe-a", { rating: 0 }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { rating: 6 }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { rating: 4.5 }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { rating: "5" }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { status: "resolved" }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { note: "nota inyectada" }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { comment: "x".repeat(1001) }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { uid: "otro" }));
    await assertFails(submit(visitor(), "visitante", "cafe-a", { createdAt: new Date("2020-01-01") }));
  });

  it("no se puede opinar sin el registro de límite ni en un negocio suspendido o inexistente", async () => {
    await assertFails(setDoc(doc(visitor(), `businesses/cafe-a/feedback/${fid()}`), { rating: 2, comment: "", uid: "visitante", status: "pending", createdAt: serverTimestamp() }));
    await assertFails(submit(visitor(), "visitante", "cerrado"));
    await assertFails(submit(visitor(), "visitante", "no-existe"));
  });

  it("límite: un segundo envío inmediato del mismo visitante se rechaza", async () => {
    await assertSucceeds(submit(visitor(), "visitante", "cafe-a"));
    await assertFails(submit(visitor(), "visitante", "cafe-a"));
    await assertFails(submit(visitor(), "visitante", "cafe-b"));
    // Otro visitante no se ve afectado.
    await assertSucceeds(submit(visitor("otro"), "otro", "cafe-a"));
  });

  it("reintento con el mismo id: no se duplica y el visitante puede comprobar que llegó", async () => {
    const id = fid();
    await assertSucceeds(submit(visitor(), "visitante", "cafe-a", {}, id));
    await assertFails(submit(visitor(), "visitante", "cafe-a", {}, id));
    await assertSucceeds(getDoc(doc(visitor(), `businesses/cafe-a/feedback/${id}`)));
    // Pero no puede leer opiniones ajenas ni listar.
    await assertFails(getDoc(doc(visitor(), "businesses/cafe-a/feedback/fa")));
    await assertFails(getDocs(collection(visitor(), "businesses/cafe-a/feedback")));
  });

  it("5 estrellas no lleva comentario", async () => {
    await assertFails(submit(visitor(), "visitante", "cafe-a", { rating: 5, comment: "hola" }));
  });

  it("el visitante no puede tocar opiniones ni el perfil", async () => {
    await assertFails(updateDoc(doc(visitor(), "businesses/cafe-a/feedback/fa"), { status: "resolved" }));
    await assertFails(updateDoc(doc(visitor(), "businesses/cafe-a"), { googleReviewUrl: "https://g.page/r/otro/review", updatedAt: serverTimestamp() }));
  });
});

describe("aislamiento entre negocios", () => {
  it("cada dueño lee solo las opiniones de su negocio", async () => {
    await assertSucceeds(getDocs(collection(owner("duenoA"), "businesses/cafe-a/feedback")));
    await assertFails(getDocs(collection(owner("duenoA"), "businesses/cafe-b/feedback")));
    await assertFails(getDoc(doc(owner("duenoA"), "businesses/cafe-b/feedback/fb")));
    await assertFails(getDoc(doc(owner("duenoA"), "access/cafe-b")));
  });

  it("un dueño no modifica opiniones ni el perfil de otro negocio", async () => {
    await assertFails(updateDoc(doc(owner("duenoA"), "businesses/cafe-b/feedback/fb"), { status: "resolved" }));
    await assertFails(updateDoc(doc(owner("duenoA"), "businesses/cafe-b"), { name: "Hackeado", updatedAt: serverTimestamp() }));
  });

  it("nadie se da acceso a sí mismo ni crea negocios desde la web", async () => {
    await assertFails(setDoc(doc(owner("duenoA"), "access/cafe-b"), { ownerUids: ["duenoA"] }));
    await assertFails(setDoc(doc(owner("duenoA"), "businesses/nuevo"), profile("Nuevo")));
  });

  it("una sesión anónima con el uid de un dueño no tiene acceso", async () => {
    const fake = env.authenticatedContext("duenoA", { firebase: { sign_in_provider: "anonymous" } }).firestore();
    await assertFails(getDocs(collection(fake, "businesses/cafe-a/feedback")));
  });
});

describe("gestión del dueño", () => {
  const ref = (db: Firestore) => doc(db, "businesses/cafe-a/feedback/fa");

  it("marca como resuelta, vuelve a pendiente y guarda la nota interna", async () => {
    await assertSucceeds(updateDoc(ref(owner("duenoA")), { status: "resolved", resolvedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref(owner("duenoA")), { status: "pending" }));
    await assertSucceeds(updateDoc(ref(owner("duenoA")), { note: "Hablé con el cliente", noteUpdatedAt: serverTimestamp() }));
  });

  it("no puede cambiar la puntuación ni el comentario, ni borrar", async () => {
    await assertFails(updateDoc(ref(owner("duenoA")), { rating: 5 }));
    await assertFails(updateDoc(ref(owner("duenoA")), { comment: "editado" }));
    await assertFails(updateDoc(ref(owner("duenoA")), { status: "otro" }));
    await assertFails(updateDoc(ref(owner("duenoA")), { note: "x".repeat(2001) }));
    const { deleteDoc } = await import("firebase/firestore");
    await assertFails(deleteDoc(ref(owner("duenoA"))));
  });

  it("edita su perfil con validación, pero no puede reactivarse", async () => {
    const db = owner("duenoA");
    const b = doc(db, "businesses/cafe-a");
    await assertSucceeds(updateDoc(b, { name: "Café A+", address: "Calle 1", googleReviewUrl: "https://maps.app.goo.gl/abc", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(b, { name: "X", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(b, { googleReviewUrl: "http://g.page/r/x", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(b, { logo: "data:image/svg+xml;base64,PHN2Zz4=", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(b, { active: false, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(b, { extra: 1, updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(b, { logo: "data:image/webp;base64,UklGRg==", updatedAt: serverTimestamp() }));
  });
});

describe("lógica compartida", () => {
  it("clasificación coherente: 1–2 negativas, 3 intermedia, 4–5 positivas", () => {
    expect([1, 2, 3, 4, 5].map(sentimentOf)).toEqual(["negative", "negative", "neutral", "positive", "positive"]);
  });

  it("filtros y estadísticas", () => {
    const now = new Date("2026-10-19T12:00:00").getTime();
    const day = 86400000;
    const fb = [
      { rating: 5, status: "pending", createdAt: new Date(now - 1 * day) },
      { rating: 4, status: "resolved", createdAt: new Date(now - 2 * day) },
      { rating: 3, status: "pending", createdAt: new Date(now - 3 * day) },
      { rating: 1, status: "pending", createdAt: new Date(now - 10 * day) },
      { rating: 2, status: "resolved", createdAt: new Date(now - 40 * day) },
    ];
    expect(applyFilter(fb, "positivas")).toHaveLength(2);
    expect(applyFilter(fb, "negativas")).toHaveLength(2);
    expect(applyFilter(fb, "pendientes").map((f) => f.rating)).toEqual([3, 1]);
    expect(applyFilter(fb, "resueltas").map((f) => f.rating)).toEqual([4, 2]);
    const w = computeStats(fb, 7, now);
    expect(w.total).toBe(3);
    expect(w.average).toBeCloseTo(4);
    expect(w.pending).toBe(2);
    expect(w.series).toHaveLength(7);
    expect(w.series.reduce((a, b) => a + b.total, 0)).toBe(3);
    const all = computeStats(fb, null, now);
    expect(all.total).toBe(5);
    expect(all.distribution).toEqual([1, 1, 1, 1, 1]);
    expect(all.negative).toBe(2);
    expect(all.series.reduce((a, b) => a + b.total, 0)).toBe(5);
    expect(computeStats([], 30, now).average).toBeNull();
  });

  it("valida enlaces de Google", () => {
    expect(checkGoogleUrl("https://g.page/r/CabcDEF/review").ok).toBe(true);
    expect(checkGoogleUrl("https://maps.app.goo.gl/xyz").ok).toBe(true);
    expect(checkGoogleUrl("ChIJN1t_tDeuEmsRUsoyG83frY4").ok).toBe(true);
    expect(checkGoogleUrl("http://g.page/r/x").ok).toBe(false);
    expect(checkGoogleUrl("https://evil.com/maps").ok).toBe(false);
    expect(checkGoogleUrl("https://www.google.com/mail").ok).toBe(false);
    expect(checkGoogleUrl("").ok).toBe(false);
  });
});
