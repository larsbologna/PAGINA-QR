import { describe, expect, it } from "vitest";
import type { ContentCategory } from "../types";
import { createProject } from "../defaults";
import { chooseCategory, setDesign } from "../projectOps";
import { contrastRatio } from "../color";
import { CATEGORIES } from "./categories";
import { designFor, isStockDesign, matchesCategoryDesign } from "./categoryDesigns";

const all = Object.keys(CATEGORIES) as ContentCategory[];

describe("diseño por defecto de cada tipo", () => {
  it("cada tipo tiene un diseño distinto y legible", () => {
    const looks = new Set(all.map((c) => `${designFor(c).background}|${designFor(c).titleFont}|${designFor(c).style}`));
    expect(looks.size).toBe(all.length);
    for (const c of all) {
      const d = designFor(c);
      expect(contrastRatio(d.text, d.background), c).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(d.accent, d.background), c).toBeGreaterThanOrEqual(3);
    }
  });

  it("elegir el tipo aplica su diseño si no fue personalizado", () => {
    const p = chooseCategory("crecimiento")(createProject());
    expect(matchesCategoryDesign(p.design, "crecimiento")).toBe(true);
    // Cambiar de tipo sin haber tocado nada también cambia el diseño.
    const q = chooseCategory("motivacion")(p);
    expect(matchesCategoryDesign(q.design, "motivacion")).toBe(true);
  });

  it("si el diseño fue personalizado, lo respeta", () => {
    const custom = setDesign({ accent: "#00ff99" })(chooseCategory("crecimiento")(createProject()));
    expect(isStockDesign(custom.design)).toBe(false);
    const q = chooseCategory("habitos")(custom);
    expect(q.brief.category).toBe("habitos");
    expect(q.design.accent).toBe("#00ff99");
  });
});
