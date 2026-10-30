import { describe, expect, it } from "vitest";
import { slideFileName, slugify } from "./filenames";

describe("nombres de exportación", () => {
  it("quita acentos y símbolos", () => {
    expect(slugify("Cómo las reseñas de Google Maps llenan tu local")).toBe("como-las-resenas-de-google-maps-llenan-tu-local");
    expect(slugify("../../etc")).toBe("etc");
    expect(slugify("¡¿!")).toBe("carrusel");
  });
  it("numera con dos dígitos", () => {
    expect(slideFileName("Mi carrusel", 3)).toBe("mi-carrusel-03.png");
    expect(slideFileName("Mi carrusel", 10)).toBe("mi-carrusel-10.png");
  });
});
