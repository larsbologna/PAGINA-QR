"use client";
import { forwardRef, useLayoutEffect, useRef } from "react";
import type { DesignConfig, FormatId, Slide as SlideData } from "@/lib/types";
import { getFormat } from "@/lib/formats";
import { withAlpha } from "@/lib/color";
import { resolveTheme } from "./theme";
import { Decorations } from "./Decorations";
import { RichText } from "./RichText";
import { Visual } from "@/components/visuals/Visual";

export interface SlideProps {
  /** Posición del slide en el carrusel, empezando en 1. */
  number: number;
  total: number;
  slide: SlideData;
  design: DesignConfig;
  format: FormatId;
  businessName?: string;
}

const MIN_FIT = 0.48;

/**
 * Un slide a tamaño real de exportación (1080 px de ancho). Para mostrarlo más chico
 * se envuelve en <ScaledSlide>; la exportación captura este mismo nodo sin escalar.
 */
export const Slide = forwardRef<HTMLDivElement, SlideProps>(function Slide({ number, total, slide, design, format, businessName }, ref) {
  const f = getFormat(format);
  const t = resolveTheme(design, slide);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasVisual = slide.visual.kind !== "none";
  const contentHeight = f.height - f.safe.top - f.safe.bottom;

  // Ajuste automático: achica los textos (y si hace falta el visual) hasta que todo
  // entre dentro del área segura, sin cortar palabras ni desbordar.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const overflowing = () =>
      el.scrollHeight > el.clientHeight + 1 ||
      Array.from(el.querySelectorAll<HTMLElement>("[data-fit]")).some((n) => n.scrollWidth > n.clientWidth + 1);
    let fit = 1;
    for (;;) {
      const vmin = fit > 0.78 ? 0.42 : fit > 0.62 ? 0.32 : 0.24;
      el.style.setProperty("--fit", String(fit));
      el.style.setProperty("--vmin", `${Math.round(contentHeight * vmin)}px`);
      if (!overflowing() || fit <= MIN_FIT) break;
      fit = Math.max(MIN_FIT, +(fit - 0.04).toFixed(2));
    }
    el.dataset.fit = String(fit);
  });

  const textAlign = t.align;
  const crossAlign = t.align === "left" ? "flex-start" : t.align === "right" ? "flex-end" : "center";
  // Composición en Z: el texto de apoyo cierra del lado opuesto al título.
  const bodyAlign = t.align === "left" ? "right" : t.align === "right" ? "left" : "center";
  const size = (px: number) => `calc(${px}px * var(--fit, 1))`;

  return (
    <div
      ref={ref}
      data-slide={number}
      style={{
        width: f.width,
        height: f.height,
        position: "relative",
        overflow: "hidden",
        background: t.bg,
        color: t.text,
        fontFamily: t.bodyFamily,
      }}
    >
      <Decorations style={design.style} t={t} number={number} width={f.width} height={f.height} />

      <div
        ref={contentRef}
        style={{
          position: "absolute",
          top: f.safe.top,
          left: f.safe.left,
          right: f.safe.right,
          height: contentHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: crossAlign,
          gap: size(34),
          overflow: "hidden",
        }}
      >
        <div data-fit style={{ width: "100%", textAlign, display: "flex", flexDirection: "column", alignItems: crossAlign, gap: size(26) }}>
          {slide.title && (
            <h2
              style={{
                margin: 0,
                fontFamily: t.titleFamily,
                fontWeight: t.titleWeight,
                fontSize: size(t.titleSize),
                lineHeight: 0.98,
                letterSpacing: "-0.02em",
                textTransform: t.upper ? "uppercase" : "none",
                whiteSpace: "pre-line",
                overflowWrap: "break-word",
                maxWidth: "100%",
              }}
            >
              <RichText text={slide.title} accent={t.accent} />
            </h2>
          )}
          {design.style === "bold" && t.intensity > 0.05 && slide.title && (
            <div style={{ width: size(120), height: size(12), borderRadius: 99, background: t.accent }} />
          )}
          {slide.subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: size(t.subtitleSize),
                lineHeight: 1.22,
                fontWeight: 500,
                color: withAlpha(t.text, 0.86),
                whiteSpace: "pre-line",
                overflowWrap: "break-word",
                maxWidth: "100%",
              }}
            >
              <RichText text={slide.subtitle} accent={t.accent} />
            </p>
          )}
        </div>

        {hasVisual && (
          <div style={{ flex: "1 1 0", minHeight: "var(--vmin)", width: "100%", position: "relative" }}>
            <Visual visual={slide.visual} t={t} />
          </div>
        )}

        {slide.body && (
          <p
            data-fit
            style={{
              margin: hasVisual ? 0 : "auto 0 0",
              width: "100%",
              textAlign: bodyAlign,
              fontSize: size(t.bodySize),
              lineHeight: 1.35,
              color: t.muted,
              whiteSpace: "pre-line",
              overflowWrap: "break-word",
            }}
          >
            <RichText text={slide.body} accent={t.accent} />
          </p>
        )}
      </div>

      {design.showFooter && (
        <div
          style={{
            position: "absolute",
            left: f.safe.left,
            right: f.safe.right,
            bottom: 72,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            letterSpacing: "0.04em",
            color: withAlpha(t.text, 0.55),
          }}
        >
          <span style={{ fontWeight: 600 }}>{businessName}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 14, fontVariantNumeric: "tabular-nums" }}>
            {number} / {total}
            {number < total && <span style={{ color: t.accent, fontSize: 30 }}>→</span>}
          </span>
        </div>
      )}
    </div>
  );
});
