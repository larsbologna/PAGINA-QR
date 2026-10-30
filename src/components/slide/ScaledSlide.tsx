"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Slide, type SlideProps } from "./Slide";
import { getFormat, type Format } from "@/lib/formats";

export interface Guides {
  /** Rectángulo del área segura donde va el contenido. */
  safe: boolean;
  /** Franjas de margen sombreadas con su medida. */
  margins: boolean;
}

/** Muestra un slide reducido a `width` px sin alterar su diseño real. */
export function ScaledSlide({ width, className = "", guides, ...props }: SlideProps & { width: number; className?: string; guides?: Guides }) {
  const f = getFormat(props.format);
  const scale = width / f.width;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height: f.height * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: f.width, height: f.height, position: "relative" }}>
        <Slide {...props} />
        {guides && (guides.safe || guides.margins) && <GuideOverlay f={f} guides={guides} />}
      </div>
    </div>
  );
}

function GuideOverlay({ f, guides }: { f: Format; guides: Guides }) {
  const { top, right, bottom, left } = f.safe;
  const shade = "repeating-linear-gradient(45deg, rgba(255,70,90,0.22) 0 14px, rgba(255,70,90,0.08) 14px 28px)";
  const label = { position: "absolute" as const, fontSize: 26, fontWeight: 700, color: "#fff", background: "rgba(255,60,80,0.9)", padding: "4px 12px", borderRadius: 8, fontFamily: "Inter Variable, sans-serif" };
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {guides.margins && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: top, background: shade }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bottom, background: shade }} />
          <div style={{ position: "absolute", left: 0, top, bottom, width: left, background: shade }} />
          <div style={{ position: "absolute", right: 0, top, bottom, width: right, background: shade }} />
          <span style={{ ...label, left: f.width / 2 - 50, top: top / 2 - 20 }}>{top} px</span>
          <span style={{ ...label, left: f.width / 2 - 50, bottom: bottom / 2 - 20 }}>{bottom} px</span>
          <span style={{ ...label, left: 4, top: f.height / 2 - 20, padding: "4px 6px" }}>{left}</span>
          <span style={{ ...label, right: 4, top: f.height / 2 - 20, padding: "4px 6px" }}>{right}</span>
        </>
      )}
      {guides.safe && (
        <div style={{ position: "absolute", top, left, right, bottom, border: "4px dashed rgba(80,220,255,0.95)", borderRadius: 6 }}>
          <span style={{ ...label, background: "rgba(40,170,220,0.95)", left: 12, top: 12 }}>
            Área segura {f.width - left - right} × {f.height - top - bottom}
          </span>
        </div>
      )}
    </div>
  );
}

/** Igual que ScaledSlide pero ocupa todo el ancho de su contenedor. */
export function FluidSlide(props: SlideProps & { className?: string; guides?: Guides }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full">
      {width > 0 && <ScaledSlide width={width} {...props} />}
    </div>
  );
}
