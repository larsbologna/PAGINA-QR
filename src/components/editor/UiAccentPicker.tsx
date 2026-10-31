"use client";
import { useEffect, useState } from "react";
import { readableOn } from "@/lib/color";

// Color de acento de la interfaz del editor (no afecta a los slides). Se recuerda por navegador.
const ACCENTS = [
  { id: "lima", label: "Lima", color: "#c6f432" },
  { id: "celeste", label: "Celeste", color: "#5cc8ff" },
  { id: "dorado", label: "Dorado suave", color: "#e3c27a" },
];
const KEY = "carrusel-studio:ui-accent";

function applyAccent(color: string) {
  document.documentElement.style.setProperty("--ui-accent", color);
  document.documentElement.style.setProperty("--ui-accent-ink", readableOn(color));
}

export function UiAccentPicker() {
  const [current, setCurrent] = useState(ACCENTS[0].color);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && ACCENTS.some((a) => a.color === saved)) {
        setCurrent(saved);
        applyAccent(saved);
      }
    } catch {
      /* sin almacenamiento: queda el acento por defecto */
    }
  }, []);

  const choose = (color: string) => {
    setCurrent(color);
    applyAccent(color);
    try {
      localStorage.setItem(KEY, color);
    } catch {
      /* ignorar */
    }
  };

  return (
    <div className="ml-1 hidden items-center gap-1 rounded-full border border-line bg-bg p-1 xl:flex" role="radiogroup" aria-label="Acento de la interfaz">
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={current === a.color}
          title={`Interfaz: ${a.label}`}
          aria-label={`Acento de la interfaz: ${a.label}`}
          onClick={() => choose(a.color)}
          className={`h-4 w-4 rounded-full transition ${current === a.color ? "ring-2 ring-white/70 ring-offset-1 ring-offset-bg" : "opacity-60 hover:opacity-100"}`}
          style={{ background: a.color }}
        />
      ))}
    </div>
  );
}
