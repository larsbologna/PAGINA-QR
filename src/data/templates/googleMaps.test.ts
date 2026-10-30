import { describe, expect, it } from "vitest";
import { createGoogleMapsProject } from "./googleMaps";

describe("plantilla Google Maps", () => {
  const p = createGoogleMapsProject();
  const plain = (s: string) => s.replace(/\*/g, "").toUpperCase();

  it("tiene los 10 slides pedidos, en orden", () => {
    expect(p.name).toBe("Cómo las reseñas de Google Maps llenan tu local");
    expect(p.slides.map((s) => plain(s.title))).toEqual([
      "TU NEGOCIO NO NECESITA MÁS ANUNCIOS",
      "¿A CUÁL ENTRÁS?",
      "GOOGLE PIENSA IGUAL QUE VOS.",
      "ASÍ TE TRAE CLIENTES",
      "NO ES SUERTE. ES ESTRATEGIA.",
      "1. QR EN EL LOCAL",
      "2. RESPONDÉ TUS RESEÑAS",
      "3. AUTOMATIZÁ POR WHATSAPP",
      "4. PEDÍ RESEÑAS CON FOTO",
      "¿ARMAMOS TU SISTEMA EN 7 DÍAS?",
    ]);
    expect(p.slides[0].role).toBe("hook");
    expect(p.slides[9].role).toBe("cta");
  });

  it("usa los visuales de Maps y los datos de la comparación", () => {
    expect(p.slides.map((s) => s.visual.kind)).toEqual([
      "store-contrast",
      "maps-compare",
      "maps-search",
      "steps",
      "presence-mix",
      "qr-stand",
      "review-reply",
      "whatsapp-chat",
      "photo-reviews",
      "cta-button",
    ]);
    expect(p.slides[1].visual.props).toMatchObject({ aRating: "3.8", aCount: "12", bRating: "4.9", bCount: "127" });
  });

  it("usa un nombre de negocio neutro", () => {
    expect(p.brief.businessName).toBe("Tu Agencia");
    expect(JSON.stringify(p)).not.toContain("Presence Web");
  });

  it("cada proyecto nuevo tiene ids propios", () => {
    const q = createGoogleMapsProject();
    expect(q.id).not.toBe(p.id);
    expect(q.slides[0].id).not.toBe(p.slides[0].id);
  });
});
