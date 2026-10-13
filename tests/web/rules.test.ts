import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, getDocs, increment, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

let env: RulesTestEnvironment;

const profile = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  brandColor: "#0f766e",
  logo: null,
  welcomeMessage: "¿Cómo fue tu experiencia?",
  thankYouMessage: "¡Gracias!",
  googleReviewUrl: "https://g.page/r/test/review",
  categories: ["Atención", "Precio"],
  active: true,
  isDemo: false,
  ...extra,
});

const opinion = (extra: Record<string, unknown> = {}) => ({
  rating: 2,
  comment: "Tardaron mucho",
  categories: ["Atención"],
  status: "NEW",
  createdAt: serverTimestamp(),
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-reputacion",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  // Datos iniciales sin reglas: dos comercios, un dueño por comercio y un admin.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "admins/admin1"), { email: "admin@test.com" });
    await setDoc(doc(db, "businesses/cafe-a"), profile("Café A"));
    await setDoc(doc(db, "businesses/cafe-b"), profile("Café B"));
    await setDoc(doc(db, "businesses/cerrado"), profile("Cerrado", { active: false }));
    await setDoc(doc(db, "access/cafe-a"), { ownerUids: ["duenoA"], ownerEmails: ["a@test.com"] });
    await setDoc(doc(db, "access/cafe-b"), { ownerUids: ["duenoB"], ownerEmails: ["b@test.com"] });
    await setDoc(doc(db, "businesses/cafe-b/feedback/fb-b"), { rating: 1, comment: "secreto de B", categories: [], status: "NEW", createdAt: new Date() });
    await setDoc(doc(db, "businesses/cafe-a/feedback/fb-a"), { rating: 3, comment: "de A", categories: [], status: "NEW", createdAt: new Date() });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

describe("Página pública (sin cuenta)", () => {
  it("puede leer el perfil del comercio para mostrar la página del QR", async () => {
    await assertSucceeds(getDoc(doc(anon(), "businesses/cafe-a")));
  });

  it("puede dejar una opinión válida, con o sin contacto", async () => {
    await assertSucceeds(addDoc(collection(anon(), "businesses/cafe-a/feedback"), opinion()));
    await assertSucceeds(
      addDoc(collection(anon(), "businesses/cafe-a/feedback"), opinion({ contact: { consent: true, name: "Ana", phone: "1155550101", email: "" } })),
    );
    await assertSucceeds(addDoc(collection(anon(), "businesses/cafe-a/feedback"), opinion({ rating: 5, comment: "", categories: [] })));
  });

  it.each([0, 6, 2.5, "5"])("rechaza la puntuación %s", async (rating) => {
    await assertFails(addDoc(collection(anon(), "businesses/cafe-a/feedback"), opinion({ rating })));
  });

  it("rechaza campos extra, estados manipulados, fechas falsas y comentarios largos", async () => {
    const col = collection(anon(), "businesses/cafe-a/feedback");
    await assertFails(addDoc(col, opinion({ hackeado: true })));
    await assertFails(addDoc(col, opinion({ status: "REVIEWED" })));
    await assertFails(addDoc(col, opinion({ createdAt: new Date("2020-01-01") })));
    await assertFails(addDoc(col, opinion({ comment: "x".repeat(1001) })));
  });

  it("rechaza contacto sin consentimiento o sin teléfono ni email", async () => {
    const col = collection(anon(), "businesses/cafe-a/feedback");
    await assertFails(addDoc(col, opinion({ contact: { consent: false, name: "", phone: "1155550101", email: "" } })));
    await assertFails(addDoc(col, opinion({ contact: { consent: true, name: "Ana", phone: "", email: "" } })));
  });

  it("no puede opinar en un comercio suspendido ni inexistente", async () => {
    await assertFails(addDoc(collection(anon(), "businesses/cerrado/feedback"), opinion()));
    await assertFails(addDoc(collection(anon(), "businesses/no-existe/feedback"), opinion()));
  });

  it("no puede leer opiniones ni quién administra cada comercio", async () => {
    await assertFails(getDoc(doc(anon(), "businesses/cafe-a/feedback/fb-a")));
    await assertFails(getDocs(collection(anon(), "businesses/cafe-a/feedback")));
    await assertFails(getDoc(doc(anon(), "access/cafe-a")));
  });

  it("solo puede sumar clics de a uno", async () => {
    const day = doc(anon(), "businesses/cafe-a/clicks/2026-10-13");
    await assertSucceeds(setDoc(day, { count: 1 }));
    await assertSucceeds(updateDoc(day, { count: increment(1) }));
    await assertFails(updateDoc(day, { count: increment(5) }));
    await assertFails(getDoc(day));
  });
});

describe("Aislamiento entre comercios", () => {
  it("el dueño de A lee sus opiniones pero no las de B", async () => {
    const db = as("duenoA");
    await assertSucceeds(getDocs(collection(db, "businesses/cafe-a/feedback")));
    await assertFails(getDocs(collection(db, "businesses/cafe-b/feedback")));
    await assertFails(getDoc(doc(db, "businesses/cafe-b/feedback/fb-b")));
    await assertFails(getDoc(doc(db, "access/cafe-b")));
  });

  it("el dueño cambia el seguimiento y la nota, pero no la puntuación ni opiniones ajenas", async () => {
    const db = as("duenoA");
    await assertSucceeds(updateDoc(doc(db, "businesses/cafe-a/feedback/fb-a"), { status: "IN_PROGRESS", statusUpdatedAt: serverTimestamp(), note: "Lo llamamos" }));
    await assertFails(updateDoc(doc(db, "businesses/cafe-a/feedback/fb-a"), { status: "INVENTADO" }));
    await assertFails(updateDoc(doc(db, "businesses/cafe-a/feedback/fb-a"), { rating: 5 }));
    await assertFails(updateDoc(doc(db, "businesses/cafe-b/feedback/fb-b"), { status: "REVIEWED" }));
  });

  it("el dueño edita su identidad pero no puede reactivarse, ni editar otro comercio, ni crear comercios", async () => {
    const db = as("duenoA");
    await assertSucceeds(updateDoc(doc(db, "businesses/cafe-a"), { welcomeMessage: "¿Qué tal todo?" }));
    await assertFails(updateDoc(doc(db, "businesses/cafe-a"), { active: false }));
    await assertFails(updateDoc(doc(db, "businesses/cafe-b"), { name: "Hackeado" }));
    await assertFails(setDoc(doc(db, "businesses/nuevo"), profile("Nuevo")));
    await assertFails(setDoc(doc(db, "access/cafe-a"), { ownerUids: ["duenoA", "intruso"], ownerEmails: [] }));
  });

  it("un usuario registrado sin comercio asignado no ve nada privado", async () => {
    const db = as("intruso");
    await assertFails(getDocs(collection(db, "businesses/cafe-a/feedback")));
    await assertFails(getDoc(doc(db, "access/cafe-a")));
    await assertFails(getDoc(doc(db, "admins/admin1")));
  });

  it("el dueño encuentra solo sus comercios con una consulta", async () => {
    const snap = await assertSucceeds(getDocs(query(collection(as("duenoA"), "access"), where("ownerUids", "array-contains", "duenoA"))));
    if (snap.docs.map((d) => d.id).join() !== "cafe-a") throw new Error("debía devolver solo cafe-a");
    await assertFails(getDocs(collection(as("duenoA"), "access")));
  });
});

describe("Superadministrador", () => {
  it("crea comercios, asigna dueños y lee todo", async () => {
    const db = as("admin1");
    await assertSucceeds(setDoc(doc(db, "businesses/nuevo"), profile("Nuevo")));
    await assertSucceeds(setDoc(doc(db, "access/nuevo"), { ownerUids: ["x"], ownerEmails: ["x@test.com"] }));
    await assertSucceeds(getDocs(collection(db, "businesses/cafe-b/feedback")));
    await assertSucceeds(updateDoc(doc(db, "businesses/cafe-b"), { active: false }));
    await assertSucceeds(getDocs(collection(db, "access")));
  });

  it("nadie puede convertirse en admin desde la app", async () => {
    await assertFails(setDoc(doc(as("intruso"), "admins/intruso"), { email: "yo@test.com" }));
  });
});
