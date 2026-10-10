export interface IndustryPreset {
  id: string;
  label: string;
  categories: string[];
}

export const INDUSTRIES: IndustryPreset[] = [
  {
    id: "restaurante",
    label: "Restaurante / Bar / Cafetería",
    categories: ["Atención", "Calidad de la comida", "Tiempo de espera", "Limpieza", "Precio", "Ambiente", "Otro"],
  },
  {
    id: "gimnasio",
    label: "Gimnasio / Centro deportivo",
    categories: ["Atención", "Equipamiento", "Clases y profesores", "Limpieza", "Horarios", "Precio", "Otro"],
  },
  {
    id: "barberia",
    label: "Barbería / Peluquería / Estética",
    categories: ["Atención", "Calidad del servicio", "Puntualidad y espera", "Limpieza", "Precio", "Otro"],
  },
  {
    id: "comercio",
    label: "Comercio / Local",
    categories: [
      "Atención al cliente",
      "Calidad del producto o servicio",
      "Tiempo de espera",
      "Limpieza",
      "Precio",
      "Organización",
      "Otro",
    ],
  },
  {
    id: "salud",
    label: "Consultorio / Salud",
    categories: ["Atención", "Puntualidad", "Explicaciones recibidas", "Limpieza", "Turnos", "Otro"],
  },
];

export function getIndustry(id: string): IndustryPreset {
  return INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES.find((i) => i.id === "comercio")!;
}
