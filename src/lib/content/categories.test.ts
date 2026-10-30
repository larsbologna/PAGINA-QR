import { describe, expect, it } from "vitest";
import type { ContentCategory } from "../types";
import { createProject } from "../defaults";
import { planFromTemplates } from "./templateGenerator";
import { CATEGORIES, categoryOf } from "./categories";
import { normalizeProject } from "../storage/normalize";
import { TEMPLATES } from "../../data/templates";

const all = Object.keys(CATEGORIES) as ContentCategory[];
const brief = (category: ContentCategory) => ({ ...createProject().brief, category, topic: "Cómo sostener lo que empiezo", businessName: "@yo" });

describe("tipos de carrusel", () => {
  it("cada tipo arma de 1 a 10 slides sin títulos repetidos ni vacíos", () => {
    for (const c of all)
      for (let n = 1; n <= 10; n++) {
        const titles = planFromTemplates({ brief: brief(c), count: n, imageStyle: "mockups" }).map((s) => s.title);
        expect(titles.every((t) => t.trim().length > 0), `${c} ${n}`).toBe(true);
        expect(new Set(titles).size, `${c} ${n}`).toBe(titles.length);
      }
  });

  it("los tipos personales no sugieren visuales de negocio", () => {
    for (const c of all.filter((x) => x !== "negocio")) {
      const kinds = planFromTemplates({ brief: brief(c), count: 10, imageStyle: "mockups" }).map((s) => s.visual.kind);
      expect(kinds.some((k) => ["phone", "review", "chat", "qr", "stats"].includes(k)), c).toBe(false);
      expect(kinds[9]).toBe("cta-button");
    }
  });

  it("el cierre usa la acción propia y la cuenta", () => {
    const slides = planFromTemplates({ brief: { ...brief("crecimiento"), cta: "Guardalo para después" }, count: 5, imageStyle: "diagramas" });
    expect(slides[4].subtitle).toBe("Guardalo para después.");
    expect(slides[4].visual.props.handle).toBe("@yo");
  });

  it("solo Mi proceso deja textos [para completar]", () => {
    for (const c of all) {
      const text = planFromTemplates({ brief: { ...brief(c), problem: "", benefit: "" }, count: 10, imageStyle: "mockups" })
        .flatMap((s) => [s.title, s.subtitle, s.body, ...Object.values(s.visual.props)])
        .join(" ");
      expect(/\[[^\]]+\]/.test(text), c).toBe(c === "proceso");
    }
  });

  it("cambia los nombres de los campos y de los slides", () => {
    expect(categoryOf(brief("negocio")).fields.businessName.label).toBe("Nombre del negocio");
    expect(categoryOf(brief("crecimiento")).fields.businessName.label).toBe("Tu nombre o cuenta");
    expect(categoryOf(brief("proceso")).roles.tip.label).toBe("Aprendizaje");
  });

  it("los proyectos viejos con slides quedan como Negocios", () => {
    const p = normalizeProject({ name: "Viejo", brief: { topic: "x" }, slides: [{ title: "Hola" }] })!;
    expect(p.brief.category).toBe("negocio");
    expect(normalizeProject({ name: "Vacío" })!.brief.category).toBe("");
  });

  it("hay plantillas de crecimiento personal y de negocio", () => {
    const cats = TEMPLATES.map((t) => t.create().brief.category);
    expect(cats).toEqual(["crecimiento", "negocio"]);
  });
});

describe("fotos en Mi proceso", () => {
  it("solo los slides de la historia piden foto", () => {
    const slides = planFromTemplates({ brief: brief("proceso"), count: 10, imageStyle: "fotos" });
    const withPhoto = slides.flatMap((s, i) => (s.visual.kind === "photo" ? [i + 1] : []));
    expect(withPhoto).toEqual([1, 2, 5]);
  });
});
