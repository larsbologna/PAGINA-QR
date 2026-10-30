import type { Visual as VisualData } from "@/lib/types";
import { VISUALS } from "@/lib/visuals";
import { withAlpha } from "@/lib/color";
import type { SlideTheme } from "@/components/slide/theme";

/** Dibuja el visual de un slide ocupando todo el espacio que le deja el texto. */
export function Visual({ visual, t }: { visual: VisualData; t: SlideTheme }) {
  if (visual.kind === "none") return null;
  // Etapa 2: marcador de posición. Los visuales reales se suman en la etapa 3.
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 36,
        border: `3px dashed ${withAlpha(t.text, 0.18)}`,
        display: "grid",
        placeItems: "center",
        color: withAlpha(t.text, 0.45),
        fontFamily: t.bodyFamily,
        fontSize: 30,
      }}
    >
      {VISUALS[visual.kind].label}
    </div>
  );
}
