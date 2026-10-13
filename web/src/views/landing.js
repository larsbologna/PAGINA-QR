import { h, mount } from "../ui.js";
import { DEMO_SLUG } from "../store/demo.js";

export function renderLanding(root, store) {
  mount(root,
    h("main", { class: "landing" },
      h("p", { class: "brand-link" }, "Reputación OS"),
      h("h1", {}, "Escuchá a tus clientes y descubrí qué mejorar."),
      h("p", { class: "lead" }, "Un QR personalizado para que tus clientes califiquen su experiencia. Las opiniones privadas quedan organizadas en tu panel, y quienes quedaron contentos pueden dejar su reseña en Google Maps."),
      h("div", { class: "row wrap" },
        store.mode === "demo" ? h("a", { class: "btn", href: `?c=${DEMO_SLUG}` }, "Probar la página del QR") : null,
        h("a", { class: store.mode === "demo" ? "btn-ghost" : "btn", href: "#/login" }, store.mode === "demo" ? "Ver el panel de demo" : "Ingresar al panel"),
      ),
      store.mode === "demo" ? h("p", { class: "muted small" }, "Modo demo: los datos son de ejemplo y se guardan solo en este navegador.") : null,
    ),
  );
}
