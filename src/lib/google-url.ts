/**
 * Validación de enlaces públicos de Google (Maps / Perfil de Empresa).
 * No usa la API de Google: solo verifica que el enlace sea https y apunte
 * a un dominio oficial de Google, para no enviar a los clientes a sitios de terceros.
 */
const ALLOWED_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "www.google.com.ar",
  "google.com.ar",
  "maps.google.com.ar",
  "search.google.com",
  "business.google.com",
  "g.page",
  "maps.app.goo.gl",
  "goo.gl",
  "g.co",
]);

export type GoogleUrlCheck =
  | { ok: true; url: string; kind: "review" | "maps" | "short" }
  | { ok: false; error: string };

/** Un Place ID de Google suele empezar con "ChIJ" y tener 20+ caracteres. */
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

export function buildReviewUrlFromPlaceId(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

export function checkGoogleUrl(raw: string): GoogleUrlCheck {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Ingresá un enlace." };
  if (!value.includes("/") && !value.includes(".") && PLACE_ID_PATTERN.test(value)) {
    return { ok: true, url: buildReviewUrlFromPlaceId(value), kind: "review" };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "El enlace no es una URL válida. Debe empezar con https://" };
  }
  if (url.protocol !== "https:") return { ok: false, error: "El enlace debe usar https://" };
  if (url.username || url.password) return { ok: false, error: "El enlace no puede incluir credenciales." };
  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return { ok: false, error: "El enlace debe ser de Google Maps o del Perfil de Empresa de Google." };
  }
  if (host === "goo.gl" && !url.pathname.startsWith("/maps")) {
    return { ok: false, error: "Los enlaces goo.gl deben ser de Google Maps (goo.gl/maps/...)." };
  }
  if (host === "g.co" && !url.pathname.startsWith("/kgs")) {
    return { ok: false, error: "El enlace g.co no parece ser de un perfil de Google." };
  }
  const isGoogleDomain = host.includes("google.");
  if (isGoogleDomain && host !== "search.google.com" && host !== "business.google.com") {
    const p = url.pathname;
    if (!(p.startsWith("/maps") || p.startsWith("/search") || p === "/" || p.startsWith("/url"))) {
      return { ok: false, error: "El enlace de google.com debe ser de Google Maps." };
    }
  }
  const kind =
    url.pathname.includes("writereview") || url.searchParams.has("placeid")
      ? "review"
      : ["g.page", "maps.app.goo.gl", "goo.gl", "g.co"].includes(host)
        ? "short"
        : "maps";
  return { ok: true, url: url.toString(), kind };
}
