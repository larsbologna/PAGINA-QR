// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { VISUALS, VISUAL_GROUPS, makeVisual, parseItems } from "./visuals";
import { applyVisualLines } from "./ai/planAi";
import { decodeIcon, encodeIcon } from "./icons";
import type { VisualKind } from "./types";

describe("catálogo de visuales", () => {
  it("cada visual tiene grupo válido y valores para todos sus campos", () => {
    for (const [kind, spec] of Object.entries(VISUALS)) {
      expect(VISUAL_GROUPS, kind).toContain(spec.group);
      for (const f of spec.fields) expect(spec.defaults, `${kind}.${f.key}`).toHaveProperty(f.key);
    }
    expect(Object.keys(VISUALS).length).toBeGreaterThanOrEqual(40);
  });

  it("los bloques por defecto traen ícono, título y texto", () => {
    const items = parseItems(makeVisual("blocks").props.items);
    expect(items).toHaveLength(4);
    expect(items.every((i) => i.icon.startsWith("{") && i.title)).toBe(true);
    expect(parseItems("no es json")).toEqual([]);
  });
});

describe("textos de la IA hacia los visuales", () => {
  it("reparte las líneas según el visual", () => {
    expect(applyVisualLines("steps", ["a", "b", "c"])).toEqual({ s1: "a", s2: "b", s3: "c", s4: "" });
    expect(applyVisualLines("do-dont", ["1", "2", "3", "x", "y", "z"])).toEqual({ do: "1\n2\n3", dont: "x\ny\nz" });
    expect(applyVisualLines("checklist", ["uno", "dos"])).toEqual({ items: "uno\ndos" });
    expect(applyVisualLines("donut", ["A: 40", "B: 60", "Tu semana"])).toEqual({ items: "A: 40\nB: 60", center: "Tu semana" });
    const blocks = parseItems(applyVisualLines("blocks", ["Foco — una sola meta", "Ritmo"]).items);
    expect(blocks.map((b) => [b.title, b.text])).toEqual([
      ["Foco", "una sola meta"],
      ["Ritmo", ""],
    ]);
  });
  it("no rompe con visuales sin campos", () => {
    expect(applyVisualLines("none" as VisualKind, ["x"])).toEqual({});
  });
});

describe("íconos guardados", () => {
  it("se codifican, se sanean y aceptan emojis", () => {
    const v = encodeIcon({ n: "x:y", v: "0 0 24 24", b: '<path d="M1 1" onclick="hack()"/>' });
    expect(decodeIcon(v)).toEqual({ n: "x:y", v: "0 0 24 24", b: '<path d="M1 1"></path>' });
    expect(decodeIcon("🚀")).toEqual({ emoji: "🚀" });
    expect(decodeIcon("")).toBeNull();
    expect(decodeIcon("{roto")).toBeNull();
  });
});
