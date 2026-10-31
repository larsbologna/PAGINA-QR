// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { sanitizeSvg, sanitizeSvgFragment } from "./sanitize";

describe("saneamiento de SVG", () => {
  it("quita scripts, eventos, foreignObject, estilos y enlaces externos", () => {
    const dirty = `<svg viewBox="0 0 10 10" onload="alert(1)"><script>alert(2)</script><foreignObject><div>x</div></foreignObject>
      <style>@import url(http://x)</style><rect width="5" height="5" fill="red" onclick="alert(3)" style="x"/>
      <image href="http://malo.com/a.png"/><use href="#ok"/><text x="1" y="2">Hola</text></svg>`;
    const clean = sanitizeSvg(dirty);
    expect(clean).toMatch(/^<svg/);
    for (const bad of ["script", "onload", "onclick", "foreignObject", "@import", "malo.com", "style="]) expect(clean).not.toContain(bad);
    expect(clean).toContain("<rect");
    expect(clean).toContain("Hola");
  });
  it("rechaza lo que no es SVG", () => {
    expect(sanitizeSvg("<div>hola</div>")).toBe("");
    expect(sanitizeSvg("texto")).toBe("");
  });
  it("sanea fragmentos de íconos", () => {
    expect(sanitizeSvgFragment('<path d="M0 0" onmouseover="x()"/>')).toBe('<path d="M0 0"></path>');
  });
});
