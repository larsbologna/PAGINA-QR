import type { ContentCategory, Project } from "@/lib/types";
import { createGoogleMapsProject, GOOGLE_MAPS_TEMPLATE_NAME } from "./googleMaps";
import { createConstanciaProject, CONSTANCIA_TEMPLATE_NAME } from "./constancia";

export interface Template {
  id: string;
  name: string;
  category: ContentCategory;
  description: string;
  create: () => Project;
}

export const TEMPLATES: Template[] = [
  {
    id: "constancia",
    name: CONSTANCIA_TEMPLATE_NAME,
    category: "crecimiento",
    description: "7 slides de crecimiento personal: reflexión, cambio de mirada, prácticas y cierre para guardar.",
    create: createConstanciaProject,
  },
  {
    id: "google-maps",
    name: GOOGLE_MAPS_TEMPLATE_NAME,
    category: "negocio",
    description: "10 slides sobre reseñas en Google Maps para locales: gancho, comparación, consejos y CTA.",
    create: createGoogleMapsProject,
  },
];
