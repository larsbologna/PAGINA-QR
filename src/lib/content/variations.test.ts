import { describe, expect, it } from "vitest";
import type { ContentCategory } from "../types";
import { createProject } from "../defaults";
import { planFromTemplates } from "./templateGenerator";
import { CATEGORIES } from "./categories";
import { isStockDesign, lookFor, looksFor, matchesCategoryDesign } from "./categoryDesigns";
import { applyProposal, chooseCategory, setDesign } from "../projectOps";
import { contrastRatio } from "../color";

const all = Object.keys(CATEGORIES) as ContentCategory[];
const brief = (category: ContentCategory) => ({ ...createProject().brief, category, topic: "Tema de prueba", businessName: "@yo" });

describe("otra versión al volver a proponer", () => {
  it("cada versión cambia textos y visuales", () => {
    for (const c of all) {
      const v = [0, 1, 2].map((version) => planFromTemplates({ brief: brief(c), count: 10, imageStyle: "diagramas", version }));
      for (const [a, b] of [
        [0, 1],
        [1, 2],
        [0, 2],
      ]) {
        const sameTitles = v[a].filter((s, i) => s.title === v[b][i].title).length;
        const sameVisuals = v[a].filter((s, i) => s.visual.kind === v[b][i].visual.kind).length;
        expect(sameTitles, `${c} v${a}/v${b} títulos`).toBeLessThanOrEqual(2);
        expect(sameVisuals, `${c} v${a}/v${b} visuales`).toBeLessThan(10);
      }
    }
  });

  it("ninguna versión repite títulos dentro del carrusel", () => {
    for (const c of all)
      for (let version = 0; version < 6; version++) {
        const titles = planFromTemplates({ brief: brief(c), count: 10, imageStyle: "mockups", version }).map((s) => s.title);
        expect(new Set(titles).size, `${c} v${version}`).toBe(titles.length);
      }
  });

  it("cada tipo tiene tres diseños distintos y legibles", () => {
    for (const c of all) {
      const looks = looksFor(c);
      expect(looks).toHaveLength(3);
      expect(new Set(looks.map((l) => l.design.background + l.design.titleFont)).size).toBe(3);
      for (const l of looks) {
        expect(contrastRatio(l.design.text, l.design.background), `${c} ${l.name}`).toBeGreaterThanOrEqual(7);
        expect(contrastRatio(l.design.accent, l.design.background), `${c} ${l.name} acento`).toBeGreaterThanOrEqual(3);
        expect(isStockDesign(l.design)).toBe(true);
        expect(matchesCategoryDesign(l.design, c)).toBe(true);
      }
      expect(lookFor(c, 3).name).toBe(lookFor(c, 0).name);
    }
  });

  it("aplica el diseño de la versión solo si no fue personalizado", () => {
    const p = chooseCategory("crecimiento")(createProject());
    const v1 = applyProposal([], 1)(p);
    expect(v1.design).toEqual(lookFor("crecimiento", 1).design);
    expect(v1.proposalVersion).toBe(1);
    const custom = setDesign({ accent: "#123456" })(p);
    expect(applyProposal([], 1)(custom).design.accent).toBe("#123456");
  });
});

describe("variedad dentro del carrusel", () => {
  it("dos slides seguidos no repiten visual", () => {
    for (const c of all)
      for (const style of ["mockups", "diagramas", "graficos", "fotos"] as const)
        for (let version = 0; version < 3; version++) {
          const kinds = planFromTemplates({ brief: brief(c), count: 10, imageStyle: style, version }).map((s) => s.visual.kind);
          kinds.forEach((k, i) => {
            if (i && k !== "none" && k !== "photo") expect(k, `${c} ${style} v${version} slide ${i + 1}`).not.toBe(kinds[i - 1]);
          });
        }
  });
});
