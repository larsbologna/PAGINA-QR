"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Slide, type SlideProps } from "./Slide";
import { getFormat } from "@/lib/formats";

/** Muestra un slide reducido a `width` px sin alterar su diseño real. */
export function ScaledSlide({ width, className = "", ...props }: SlideProps & { width: number; className?: string }) {
  const f = getFormat(props.format);
  const scale = width / f.width;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height: f.height * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: f.width, height: f.height }}>
        <Slide {...props} />
      </div>
    </div>
  );
}

/** Igual que ScaledSlide pero ocupa todo el ancho de su contenedor. */
export function FluidSlide(props: SlideProps & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="w-full">{width > 0 && <ScaledSlide width={width} {...props} />}</div>;
}
