import { beforeEach, describe, expect, it } from "vitest";
import { LocalPresetRepository, LocalProjectRepository } from "./localStorage";
import { normalizeProject } from "./normalize";
import { StorageFullError } from "./types";
import { createProject, DEFAULT_DESIGN } from "../defaults";
import { createGoogleMapsProject } from "../../data/templates/googleMaps";

class MemoryStorage {
  data = new Map<string, string>();
  limit = Infinity;
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (v.length > this.limit) throw new DOMException("lleno", "QuotaExceededError");
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

let mem: MemoryStorage;
beforeEach(() => {
  mem = new MemoryStorage();
  (globalThis as { localStorage?: unknown }).localStorage = mem;
});

describe("proyectos en localStorage", () => {
  it("guarda, lista del más reciente al más viejo, abre y elimina", async () => {
    const repo = new LocalProjectRepository();
    const a = { ...createProject("A"), updatedAt: 1 };
    const b = { ...createGoogleMapsProject(), updatedAt: 2 };
    await repo.save(a);
    await repo.save(b);
    expect((await repo.list()).map((p) => p.name)).toEqual([b.name, "A"]);
    expect((await repo.get(b.id))?.slides).toHaveLength(10);
    await repo.save({ ...a, name: "A renombrado", updatedAt: 3 });
    expect((await repo.list())[0].name).toBe("A renombrado");
    await repo.setLastOpened(a.id);
    await repo.remove(a.id);
    expect(await repo.list()).toHaveLength(1);
    expect(await repo.getLastOpened()).toBeNull();
  });

  it("avisa cuando el navegador se queda sin espacio", async () => {
    mem.limit = 100;
    await expect(new LocalProjectRepository().save(createGoogleMapsProject())).rejects.toBeInstanceOf(StorageFullError);
  });

  it("ignora datos corruptos", async () => {
    mem.setItem("carrusel-studio:v1:projects", "{no es json");
    expect(await new LocalProjectRepository().list()).toEqual([]);
  });
});

describe("diseños guardados", () => {
  it("guarda y elimina", async () => {
    const repo = new LocalPresetRepository();
    await repo.save({ id: "d1", name: "Oscuro", design: DEFAULT_DESIGN, createdAt: 1 });
    expect((await repo.list()).map((p) => p.name)).toEqual(["Oscuro"]);
    await repo.remove("d1");
    expect(await repo.list()).toEqual([]);
  });
});

describe("normalización", () => {
  it("completa campos faltantes y descarta lo inválido", () => {
    const p = normalizeProject({
      name: "Viejo",
      format: "999x1",
      design: { accent: "#ff0000" },
      slides: [{ title: "Hola", visual: { kind: "inexistente" } }, "basura", { title: "Chau", visual: { kind: "qr", props: { seed: "x", n: 3 }, image: "javascript:alert(1)" } }],
    })!;
    expect(p.format).toBe("1080x1440");
    expect(p.design.accent).toBe("#ff0000");
    expect(p.design.titleFont).toBe(DEFAULT_DESIGN.titleFont);
    expect(p.slides).toHaveLength(2);
    expect(p.slides[0].visual.kind).toBe("none");
    expect(p.slides[1].visual.props.seed).toBe("x");
    expect(p.slides[1].visual.image).toBeUndefined();
    expect(normalizeProject("nada")).toBeNull();
  });
});
