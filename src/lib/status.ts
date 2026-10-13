/** Etiquetas de los estados de seguimiento. */
export const STATUS_LABELS = {
  NEW: "Nueva",
  IN_PROGRESS: "En seguimiento",
  REVIEWED: "Resuelta",
} as const;

export type FollowUp = keyof typeof STATUS_LABELS;
