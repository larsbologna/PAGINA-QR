import { describe, expect, it } from "vitest";
import { structureFor } from "./content/narrative";
import { extractTips, planFromTemplates } from "./content/templateGenerator";
import { createProject } from "./defaults";
import { deleteSlide, duplicateSlide, moveSlide, setPlan, setSlideCount } from "./projectOps";
import { contrastRatio, contrastLevel } from "./color";
import { __reducer } from "./store";
import { rename } from "./projectOps";

const brief = { ...createProject().brief, topic: "Cómo conseguir más reseñas", businessName: "Don Tano", audience: "dueños de pizzerías", cta: "Escribí RESEÑAS" };

describe("estructura narrativa", () => {
  it("10 slides sigue la estructura sugerida", () => {
    expect(structureFor(10)).toEqual(["hook", "problem", "example", "how", "proof", "tip", "tip", "tip", "tip", "cta"]);
  });
  it("de 1 a 10 empieza con gancho y, desde 2, cierra con CTA", () => {
    for (let n = 1; n <= 10; n++) {
      const s = structureFor(n);
      expect(s).toHaveLength(n);
      expect(s[0]).toBe("hook");
      if (n > 1) expect(s[n - 1]).toBe("cta");
    }
  });
  it("limita a 1..10", () => {
    expect(structureFor(0)).toHaveLength(1);
    expect(structureFor(25)).toHaveLength(10);
  });
});

describe("generador por plantillas", () => {
  it("no repite títulos", () => {
    for (let n = 1; n <= 10; n++) {
      const titles = planFromTemplates({ brief, count: n, imageStyle: "mockups" }).map((s) => s.title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });
  it("usa la temática y el CTA del brief", () => {
    const slides = planFromTemplates({ brief, count: 10, imageStyle: "mockups" });
    expect(slides[0].title).toBe("Cómo conseguir más reseñas");
    expect(slides[9].subtitle).toBe("Escribí RESEÑAS.");
    expect(slides[9].visual.kind).toBe("cta-button");
  });
  it("toma consejos propios de las instrucciones", () => {
    expect(extractTips("nota\n- QR en el local: en mesa o mostrador\n2) Respondé todo")).toEqual([
      { title: "QR en el local", subtitle: "en mesa o mostrador", body: "" },
      { title: "Respondé todo", subtitle: "", body: "" },
    ]);
    const slides = planFromTemplates({ brief: { ...brief, extra: "- QR en el local: en mesa" }, count: 10, imageStyle: "fotos" });
    expect(slides[5].title).toBe("1. QR en el local");
  });
  it("funciona con el brief vacío", () => {
    const slides = planFromTemplates({ brief: createProject().brief, count: 10, imageStyle: "graficos" });
    expect(slides.every((s) => s.title.length > 0)).toBe(true);
  });
});

describe("operaciones sobre slides", () => {
  const base = setPlan(planFromTemplates({ brief, count: 5, imageStyle: "mockups" }))(createProject());

  it("cambiar la cantidad conserva el CTA al final", () => {
    const more = setSlideCount(8)(base);
    expect(more.slides).toHaveLength(8);
    expect(more.slides[7].role).toBe("cta");
    const less = setSlideCount(2)(more);
    expect(less.slides.map((s) => s.role)).toEqual(["hook", "cta"]);
  });
  it("duplicar, borrar y mover", () => {
    const id = base.slides[1].id;
    const dup = duplicateSlide(id, "copia")(base);
    expect(dup.slides[2].id).toBe("copia");
    expect(dup.slides[2].title).toBe(base.slides[1].title);
    expect(deleteSlide(id)(base).slides).toHaveLength(4);
    expect(moveSlide(id, -1)(base).slides[0].id).toBe(id);
    expect(moveSlide(base.slides[0].id, -1)(base)).toBe(base);
  });
  it("no pasa de 10 ni baja de 1", () => {
    const ten = setSlideCount(10)(base);
    expect(duplicateSlide(ten.slides[0].id)(ten).slides).toHaveLength(10);
    const one = setSlideCount(1)(base);
    expect(deleteSlide(one.slides[0].id)(one).slides).toHaveLength(1);
  });
});

describe("contraste WCAG", () => {
  it("calcula el ratio", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastLevel(contrastRatio("#777777", "#ffffff"))).toBe("AA grande");
  });
});

describe("historial", () => {
  it("agrupa escritura seguida y permite deshacer/rehacer", () => {
    const p = createProject("A");
    let s = { past: [], present: p, future: [], lastKey: null, lastAt: 0 } as Parameters<typeof __reducer>[0];
    s = __reducer(s, { type: "apply", recipe: rename("AB"), key: "name", at: 1000 });
    s = __reducer(s, { type: "apply", recipe: rename("ABC"), key: "name", at: 1500 });
    expect(s.past).toHaveLength(1);
    s = __reducer(s, { type: "undo" });
    expect(s.present.name).toBe("A");
    s = __reducer(s, { type: "redo" });
    expect(s.present.name).toBe("ABC");
  });
});
