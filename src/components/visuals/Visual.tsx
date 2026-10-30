import type { ComponentType } from "react";
import type { Visual as VisualData, VisualKind } from "@/lib/types";
import { VISUALS } from "@/lib/visuals";
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
import {
  MapsCompareVisual,
  MapsSearchVisual,
  PhotoReviewsVisual,
  PresenceMixVisual,
  QrStandVisual,
  ReviewReplyVisual,
  StoreContrastVisual,
  WhatsappChatVisual,
} from "./maps";

const REGISTRY: Record<Exclude<VisualKind, "none">, ComponentType<VisualProps>> = {
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
  "store-contrast": StoreContrastVisual,
  "maps-compare": MapsCompareVisual,
  "maps-search": MapsSearchVisual,
  "presence-mix": PresenceMixVisual,
  "qr-stand": QrStandVisual,
  "review-reply": ReviewReplyVisual,
  "whatsapp-chat": WhatsappChatVisual,
  "photo-reviews": PhotoReviewsVisual,
};

/** Dibuja el visual de un slide ocupando todo el espacio que le deja el texto. */
export function Visual({ visual, t, d3 }: { visual: VisualData; t: SlideTheme; d3: boolean }) {
  if (visual.kind === "none") return null;
  const Component = REGISTRY[visual.kind];
  const props = { ...VISUALS[visual.kind].defaults, ...visual.props };
  return <Component p={props} t={t} image={visual.image} d3={d3} />;
}
