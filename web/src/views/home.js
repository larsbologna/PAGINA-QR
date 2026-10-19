// Raíz de la web (sin ?c=): solo identifica el servicio y lleva al panel.
// Los clientes nunca llegan acá: el QR abre directamente ?c=<negocio>.
import { BRAND, brandLogo } from "../brand.js";
import { reviewArt } from "../review-art.js";
import { h, mount } from "../ui.js";

export function renderHome(root, notice) {
  document.title = BRAND.name;
  mount(
    root,
    h(
      "div",
      { class: "auth" },
      h("div", { class: "auth-art" }, reviewArt("inicio", { width: 1200, height: 800 })),
      h(
        "main",
        { class: "auth-card center" },
        brandLogo({ size: 34 }),
        h("p", { class: "muted" }, BRAND.tagline),
        notice ? h("p", { class: "alert", role: "alert" }, notice) : h("a", { class: "btn btn-primary btn-lg", href: "#/login" }, "Ingresar al panel"),
        h("p", { class: "muted small" }, "¿Sos cliente? Escaneá el QR del negocio para dejar tu opinión."),
      ),
    ),
  );
}
