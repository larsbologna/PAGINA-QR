import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, updateDoc } from "firebase/firestore";

let env: RulesTestEnvironment;

const account = (over: Record<string, unknown> = {}) => ({
  email: "cliente@ejemplo.com",
  name: "Cliente",
  active: true,
  note: "",
  createdAt: 1,
  updatedAt: 1,
  createdBy: "admin",
  ...over,
});
const project = (id: string) => ({ id, name: "P", slides: [], stage: "brief" });

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-carrusel",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
afterAll(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "cs_admins/admin"), { createdAt: 1 });
    await setDoc(doc(db, "cs_accounts/ana"), account({ email: "ana@ejemplo.com" }));
    await setDoc(doc(db, "cs_accounts/beto"), account({ email: "beto@ejemplo.com", active: false }));
    await setDoc(doc(db, "cs_accounts/ana/projects/p1"), project("p1"));
  });
});

describe("cuentas", () => {
  it("solo el administrador crea, lista y habilita cuentas", async () => {
    const admin = env.authenticatedContext("admin").firestore();
    await assertSucceeds(setDoc(doc(admin, "cs_accounts/nuevo"), account()));
    await assertSucceeds(getDocs(collection(admin, "cs_accounts")));
    await assertSucceeds(updateDoc(doc(admin, "cs_accounts/beto"), { active: true, updatedAt: 2 }));

    const ana = env.authenticatedContext("ana").firestore();
    await assertFails(setDoc(doc(ana, "cs_accounts/otro"), account()));
    await assertFails(getDocs(collection(ana, "cs_accounts")));
    await assertSucceeds(getDoc(doc(ana, "cs_accounts/ana")));
    await assertFails(getDoc(doc(ana, "cs_accounts/beto")));
  });

  it("un cliente no puede habilitarse ni cambiar su propia cuenta", async () => {
    const beto = env.authenticatedContext("beto").firestore();
    await assertFails(updateDoc(doc(beto, "cs_accounts/beto"), { active: true }));
    const ana = env.authenticatedContext("ana").firestore();
    await assertFails(updateDoc(doc(ana, "cs_accounts/ana"), { name: "Otra" }));
  });

  it("nadie puede nombrarse administrador", async () => {
    const ana = env.authenticatedContext("ana").firestore();
    await assertFails(setDoc(doc(ana, "cs_admins/ana"), { createdAt: 1 }));
  });

  it("el administrador no guarda campos inválidos", async () => {
    const admin = env.authenticatedContext("admin").firestore();
    await assertFails(setDoc(doc(admin, "cs_accounts/x"), account({ active: "sí" })));
    await assertFails(setDoc(doc(admin, "cs_accounts/x"), { ...account(), extra: 1 }));
  });
});

describe("proyectos", () => {
  it("cada cliente activo solo accede a sus proyectos", async () => {
    const ana = env.authenticatedContext("ana").firestore();
    await assertSucceeds(getDocs(collection(ana, "cs_accounts/ana/projects")));
    await assertSucceeds(setDoc(doc(ana, "cs_accounts/ana/projects/p2"), project("p2")));
    await assertSucceeds(deleteDoc(doc(ana, "cs_accounts/ana/projects/p2")));

    const beto = env.authenticatedContext("beto").firestore();
    await assertFails(getDoc(doc(beto, "cs_accounts/ana/projects/p1")));
    await assertFails(setDoc(doc(beto, "cs_accounts/ana/projects/p9"), project("p9")));
  });

  it("una cuenta deshabilitada no puede usar sus proyectos", async () => {
    const beto = env.authenticatedContext("beto").firestore();
    await assertFails(setDoc(doc(beto, "cs_accounts/beto/projects/p1"), project("p1")));
    await assertFails(getDocs(collection(beto, "cs_accounts/beto/projects")));
  });

  it("el administrador no lee los proyectos de los clientes", async () => {
    const admin = env.authenticatedContext("admin").firestore();
    await assertFails(getDoc(doc(admin, "cs_accounts/ana/projects/p1")));
  });

  it("sin sesión no se accede a nada", async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "cs_accounts/ana")));
    await assertFails(getDoc(doc(anon, "cs_accounts/ana/projects/p1")));
  });

  it("valida proyectos e imágenes", async () => {
    const ana = env.authenticatedContext("ana").firestore();
    await assertFails(setDoc(doc(ana, "cs_accounts/ana/projects/p3"), project("otro-id")));
    await assertFails(setDoc(doc(ana, "cs_accounts/ana/projects/p3"), { ...project("p3"), slides: new Array(11).fill({}) }));
    await assertSucceeds(setDoc(doc(ana, "cs_accounts/ana/assets/a1"), { data: "data:image/jpeg;base64,AAAA", createdAt: 1 }));
    await assertFails(setDoc(doc(ana, "cs_accounts/ana/assets/a2"), { data: "javascript:alert(1)", createdAt: 1 }));
    await assertFails(updateDoc(doc(ana, "cs_accounts/ana/assets/a1"), { data: "data:image/png;base64,BBBB" }));
  });
});
