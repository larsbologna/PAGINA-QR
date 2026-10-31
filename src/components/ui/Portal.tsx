"use client";
import { createPortal } from "react-dom";

/**
 * Monta el contenido directamente en <body>. Las ventanas emergentes que se abren desde
 * un panel lo necesitan: si un contenedor tiene transformaciones o animaciones, el
 * "position: fixed" queda atrapado adentro y la ventana se mezcla con el panel.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
