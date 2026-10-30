"use client";
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { withAlpha } from "@/lib/color";
import type { SlideTheme } from "@/components/slide/theme";

/**
 * Dibuja el contenido en un lienzo fijo (w × h) y lo escala para que entre completo
 * en el espacio disponible, centrado. Así cada visual se diseña una sola vez en px.
 */
export function FitBox({ w, h, children, align = "center" }: { w: number; h: number; children: ReactNode; align?: "center" | "start" }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const s = Math.min(o.clientWidth / w, o.clientHeight / h);
      if (!isFinite(s) || s <= 0) return;
      const left = align === "center" ? (o.clientWidth - w * s) / 2 : 0;
      const top = (o.clientHeight - h * s) / 2;
      i.style.transform = `translate(${left}px, ${top}px) scale(${s})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    return () => ro.disconnect();
  }, [w, h, align]);

  return (
    <div ref={outer} style={{ position: "absolute", inset: 0 }}>
      <div ref={inner} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0" }}>
        {children}
      </div>
    </div>
  );
}

/** Marca discreta para dejar claro que una interfaz simulada es una ilustración. */
export function IllustrationTag({ t, style }: { t: SlideTheme; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        fontSize: 15,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: withAlpha(t.text, 0.42),
        fontFamily: t.bodyFamily,
        ...style,
      }}
    >
      Ilustración
    </div>
  );
}

export function cardStyle(t: SlideTheme, extra?: CSSProperties): CSSProperties {
  return {
    background: t.surface,
    borderRadius: 28,
    border: `1.5px solid ${t.line}`,
    boxShadow: t.dark ? "0 30px 80px -30px rgba(0,0,0,0.85)" : "0 30px 70px -35px rgba(20,20,40,0.35)",
    ...extra,
  };
}

/** Inclinación tipo 3D cuando el estilo de imágenes lo pide. */
export function depth(on: boolean, deg = 14): CSSProperties {
  return on ? { transform: `perspective(1600px) rotateY(-${deg}deg) rotateX(6deg)`, transformStyle: "preserve-3d" } : {};
}

export function Stars({ n, size = 26, color = "#fbbc04", dim = "#5f6368" }: { n: number; size?: number; color?: string; dim?: string }) {
  return (
    <span style={{ display: "inline-flex", gap: size * 0.12 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, n - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`st${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor={color} />
                <stop offset={`${fill * 100}%`} stopColor={dim} />
              </linearGradient>
            </defs>
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill={`url(#st${i}-${Math.round(fill * 100)})`} />
          </svg>
        );
      })}
    </span>
  );
}

export function lines(s: string | undefined): string[] {
  return (s ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function list(s: string | undefined): string[] {
  return (s ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
}
