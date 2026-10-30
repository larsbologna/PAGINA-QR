import type { FormatId } from "./types";

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Format {
  id: FormatId;
  label: string;
  hint: string;
  width: number;
  height: number;
  safe: SafeArea;
}

const SAFE: SafeArea = { top: 180, right: 50, bottom: 180, left: 50 };

export const FORMATS: Record<FormatId, Format> = {
  "1080x1440": { id: "1080x1440", label: "1080 × 1440", hint: "Carrusel 3:4 (recomendado)", width: 1080, height: 1440, safe: SAFE },
  "1080x1350": { id: "1080x1350", label: "1080 × 1350", hint: "4:5 · formato publicitario", width: 1080, height: 1350, safe: SAFE },
};

export function getFormat(id: FormatId): Format {
  return FORMATS[id] ?? FORMATS["1080x1440"];
}
