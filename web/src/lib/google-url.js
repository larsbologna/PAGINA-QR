// Validación de enlaces públicos de Google Maps / Perfil de Empresa.
// No usa la API de Google: solo verifica que el enlace sea https y apunte a un
// dominio oficial de Google, para no enviar a los clientes a sitios de terceros.
const ALLOWED_HOSTS = new Set([
  "google.com", "www.google.com", "maps.google.com",
  "google.com.ar", "www.google.com.ar", "maps.google.com.ar",
  "search.google.com", "business.google.com",
  "g.page", "maps.app.goo.gl", "goo.gl", "g.co",
]);

/** Un Place ID de Google suele empezar con "ChIJ" y tener 20+ caracteres. */
const PLACE_ID = /^[A-Za-z0-9_-]{20,}$/;

/** @returns {{ok: true, url: string} | {ok: false, error: string}} */
export function checkGoogleUrl(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return { ok: false, error: "Ingresá un enlace." };
  if (!value.includes("/") && !value.includes(".") && PLACE_ID.test(value)) {
    return { ok: true, url: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(value)}` };
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "No es un enlace válido. Debe empezar con https://" };
  }
  if (url.protocol !== "https:") return { ok: false, error: "El enlace debe empezar con https://" };
  if (url.username || url.password) return { ok: false, error: "El enlace no puede incluir usuario ni contraseña." };
  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return { ok: false, error: "Tiene que ser un enlace de Google Maps o de tu Perfil de Empresa de Google." };
  if (host === "goo.gl" && !url.pathname.startsWith("/maps")) return { ok: false, error: "Los enlaces goo.gl deben ser de Google Maps (goo.gl/maps/…)." };
  if (host === "g.co" && !url.pathname.startsWith("/kgs")) return { ok: false, error: "El enlace g.co no parece ser de un perfil de Google." };
  if (host.includes("google.") && host !== "search.google.com" && host !== "business.google.com") {
    const p = url.pathname;
    if (!(p.startsWith("/maps") || p.startsWith("/search") || p === "/" || p.startsWith("/url"))) {
      return { ok: false, error: "El enlace de google.com debe ser de Google Maps." };
    }
  }
  if (url.toString().length > 500) return { ok: false, error: "El enlace es demasiado largo." };
  return { ok: true, url: url.toString() };
}
