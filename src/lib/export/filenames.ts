// Nombres de archivo de exportación: <proyecto>-01.png, <proyecto>-02.png…

export function slugify(s: string): string {
  const slug = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "carrusel";
}

export function slideFileName(prefix: string, number: number): string {
  return `${slugify(prefix)}-${String(number).padStart(2, "0")}.png`;
}
