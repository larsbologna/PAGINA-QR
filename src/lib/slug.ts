/** Convierte un nombre en un slug apto para URL: "Café La Esquina" → "cafe-la-esquina". */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 60 && SLUG_PATTERN.test(slug);
}

/** Slugs reservados que podrían confundirse con rutas del sistema. */
export const RESERVED_SLUGS = new Set(["admin", "panel", "api", "login", "demo", "r", "qr", "static"]);
