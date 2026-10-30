import type { ComponentType } from "react";
import type { Visual as VisualData, VisualKind } from "@/lib/types";
import { VISUALS } from "@/lib/visuals";
import { withAlpha } from "@/lib/color";
import type { SlideTheme } from "@/components/slide/theme";
import {
  ChatVisual,
  ChecklistVisual,
  ComparisonVisual,
  CtaButtonVisual,
  PhoneVisual,
  PhotoVisual,
  QrVisual,
  QuoteVisual,
  ReviewVisual,
  StatsVisual,
  StepsVisual,
  type VisualProps,
} from "./general";

const REGISTRY: Partial<Record<VisualKind, ComponentType<VisualProps>>> = {
  photo: PhotoVisual,
  phone: PhoneVisual,
  stats: StatsVisual,
  steps: StepsVisual,
  comparison: ComparisonVisual,
  checklist: ChecklistVisual,
  quote: QuoteVisual,
  qr: QrVisual,
  chat: ChatVisual,
  review: ReviewVisual,
  "cta-button": CtaButtonVisual,
};

/** Dibuja el visual de un slide ocupando todo el espacio que le deja el texto. */
export function Visual({ visual, t, d3 }: { visual: VisualData; t: SlideTheme; d3: boolean }) {
  if (visual.kind === "none") return null;
  const Component = REGISTRY[visual.kind];
  const props = { ...VISUALS[visual.kind].defaults, ...visual.props };
  if (Component) return <Component p={props} t={t} image={visual.image} d3={d3} />;
  // Visual todavía sin componente: marcador visible solo para que se note.
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 36, border: `3px dashed ${withAlpha(t.text, 0.18)}`, display: "grid", placeItems: "center", color: withAlpha(t.text, 0.45), fontFamily: t.bodyFamily, fontSize: 30 }}>
      {VISUALS[visual.kind].label}
    </div>
  );
}
