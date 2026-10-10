import { describe, expect, it } from "vitest";
import { slugify, isValidSlug } from "@/lib/slug";
import { checkGoogleUrl } from "@/lib/google-url";
import { contrastRatio, textOnColor, accessibleOnWhite } from "@/lib/color";
import { escapeCsvCell, toCsv } from "@/lib/csv";
import { classifyRating } from "@/lib/rating";
import { parseFeedbackFilters, filtersToSearchParams } from "@/lib/feedback-filters";
import { bucketKeyForDay, bucketKeys } from "@/lib/buckets";
import { periodRanges, parsePeriod } from "@/lib/periods";
import { feedbackSubmissionSchema, brandingSchema } from "@/lib/validation";

describe("slug", () => {
  it("normaliza acentos, eñes y símbolos", () => {
    expect(slugify("Café La Esquina")).toBe("cafe-la-esquina");
    expect(slugify("  Peña & Ñandú!!  ")).toBe("pena-y-nandu");
    expect(slugify("---")).toBe("");
    expect(isValidSlug("cafe-la-esquina")).toBe(true);
    expect(isValidSlug("Cafe")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
  });
});

describe("enlace de Google", () => {
  it.each([
    "https://g.page/r/CbXyz123/review",
    "https://maps.app.goo.gl/AbCdEf123",
    "https://www.google.com/maps/place/Cafe/@-34.6,-58.4,17z",
    "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    "https://goo.gl/maps/abc",
  ])("acepta %s", (url) => expect(checkGoogleUrl(url).ok).toBe(true));

  it.each([
    "http://g.page/r/abc",
    "https://g.page.evil.com/r/abc",
    "https://evil.com/?q=google.com",
    "javascript:alert(1)",
    "https://www.google.com/accounts",
    "https://user:pass@www.google.com/maps",
    "no es una url",
  ])("rechaza %s", (url) => expect(checkGoogleUrl(url).ok).toBe(false));

  it("convierte un Place ID en enlace directo para reseñar", () => {
    const r = checkGoogleUrl("ChIJN1t_tDeuEmsRUsoyG83frY4");
    expect(r).toEqual({ ok: true, kind: "review", url: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4" });
  });
});

describe("color", () => {
  it("elige texto legible sobre el color de marca", () => {
    expect(textOnColor("#000000")).toBe("#ffffff");
    expect(textOnColor("#ffff00")).toBe("#111827");
    expect(contrastRatio(accessibleOnWhite("#ffff00"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("CSV", () => {
  it("escapa separadores, comillas y fórmulas", () => {
    expect(escapeCsvCell("hola; chau")).toBe('"hola; chau"');
    expect(escapeCsvCell('dijo "bien"')).toBe('"dijo ""bien"""');
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("-5")).toBe("'-5");
    expect(escapeCsvCell(null)).toBe("");
    expect(toCsv(["a", "b"], [[1, "x"]])).toBe("﻿a;b\r\n1;x\r\n");
  });
});

describe("clasificación de puntuaciones", () => {
  it("usa umbrales configurables", () => {
    expect([1, 2, 3, 4, 5].map((r) => classifyRating(r))).toEqual(["negative", "negative", "neutral", "positive", "positive"]);
    expect([1, 2, 3, 4, 5].map((r) => classifyRating(r, { positiveMin: 5, negativeMax: 3 }))).toEqual([
      "negative", "negative", "negative", "neutral", "positive",
    ]);
  });
});

describe("filtros de la bandeja", () => {
  it("ignora valores inválidos y hace ida y vuelta por la URL", () => {
    const f = parseFeedbackFilters({ puntuacion: "5,1,9,abc,1", estado: "revisadas", dias: "13", orden: "drop table", pagina: "-3" });
    expect(f.ratings).toEqual([1, 5]);
    expect(f.status).toBe("REVIEWED");
    expect(f.days).toBeNull();
    expect(f.sort).toBe("recientes");
    expect(f.page).toBe(1);
    const back = parseFeedbackFilters(Object.fromEntries(filtersToSearchParams({ ...f, days: 30, page: 3 })));
    expect(back).toEqual({ ...f, days: 30, page: 3 });
  });
});

describe("períodos y agrupación temporal", () => {
  it("calcula el período anterior de igual duración", () => {
    const now = new Date("2026-03-31T12:00:00Z");
    const { current, previous } = periodRanges(30, now);
    expect(current.to.getTime() - current.from.getTime()).toBe(30 * 86400000);
    expect(previous.to.getTime()).toBe(current.from.getTime());
    expect(parsePeriod("999").value).toBe("30");
  });

  it("agrupa por semana (lunes) y por mes", () => {
    expect(bucketKeyForDay("2026-10-08", "week")).toBe("2026-10-05"); // jueves → lunes
    expect(bucketKeyForDay("2026-10-05", "week")).toBe("2026-10-05");
    expect(bucketKeyForDay("2026-10-11", "week")).toBe("2026-10-05"); // domingo
    expect(bucketKeyForDay("2026-10-08", "month")).toBe("2026-10-01");
    const keys = bucketKeys(new Date("2026-10-01T15:00:00Z"), new Date("2026-10-07T15:00:00Z"), "day", "America/Argentina/Buenos_Aires");
    expect(keys).toEqual(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"]);
  });
});

describe("validación de entrada", () => {
  it("valida el envío público", () => {
    const ok = feedbackSubmissionSchema.safeParse({ slug: "x", rating: 3, submissionKey: "12345678-abcd" });
    expect(ok.success).toBe(true);
    expect(feedbackSubmissionSchema.safeParse({ slug: "x", rating: 3, submissionKey: "<script>" }).success).toBe(false);
    expect(feedbackSubmissionSchema.safeParse({ slug: "x", rating: 3, submissionKey: "12345678", categoryIds: Array(20).fill("a") }).success).toBe(false);
  });

  it("valida la configuración de marca", () => {
    const base = { name: "Café", brandColor: "#112233", welcomeMessage: "¿Cómo te fue?", thankYouMessage: "Gracias", googleReviewUrl: "" };
    const r = brandingSchema.safeParse(base);
    expect(r.success && r.data.googleReviewUrl).toBe(null);
    expect(brandingSchema.safeParse({ ...base, brandColor: "red" }).success).toBe(false);
    expect(brandingSchema.safeParse({ ...base, googleReviewUrl: "https://evil.com" }).success).toBe(false);
  });
});
