import type { Align, DesignConfig, Slide } from "@/lib/types";
import { getFont } from "@/lib/fonts";
import { isDark, mix, readableOn } from "@/lib/color";

/** Valores finales con los que se dibuja un slide: diseño general + ajustes propios del slide. */
export interface SlideTheme {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentInk: string;
  line: string;
  dark: boolean;
  titleFamily: string;
  titleWeight: number;
  bodyFamily: string;
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  align: Align;
  upper: boolean;
  intensity: number;
}

export function resolveTheme(design: DesignConfig, slide?: Slide): SlideTheme {
  const o = slide?.overrides ?? {};
  const bg = o.background ?? design.background;
  const text = o.text ?? design.text;
  const accent = o.accent ?? design.accent;
  const titleFont = getFont(design.titleFont);
  // Si el slide cambia el fondo, la superficie se deriva de ese fondo para no desentonar.
  const surface = o.background ? mix(bg, text, 0.08) : design.surface;
  return {
    bg,
    surface,
    text,
    muted: mix(text, bg, 0.32),
    accent,
    accentInk: readableOn(accent),
    line: mix(bg, text, 0.16),
    dark: isDark(bg),
    titleFamily: titleFont.family,
    titleWeight: titleFont.titleWeight,
    bodyFamily: getFont(design.bodyFont).family,
    titleSize: design.titleSize * (o.titleScale ?? 1),
    subtitleSize: design.subtitleSize * (o.textScale ?? 1),
    bodySize: design.bodySize * (o.textScale ?? 1),
    align: o.align ?? design.align,
    upper: design.titleCase === "upper",
    intensity: design.intensity / 100,
  };
}
