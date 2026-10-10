export const PLAN_LABELS = {
  BASICO: "Básico",
  PROFESIONAL: "Profesional",
  PREMIUM: "Premium",
} as const;

export type PlanKey = keyof typeof PLAN_LABELS;
export const PLAN_KEYS = Object.keys(PLAN_LABELS) as PlanKey[];

export const STATUS_LABELS = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
} as const;
