// Punto de entrada.
//   ?c=<negocio>              pantalla pública del QR
//   #/login                   ingreso al panel
//   #/panel/<negocio>/...     panel privado
import { createStore } from "./store.js";
import { renderPublic } from "./views/public.js";
import { renderLogin } from "./views/login.js";
import { closePanel, renderPanel } from "./views/panel.js";
import { renderHome } from "./views/home.js";
import { SLUG_RE } from "./lib/feedback.js";
import { BRAND } from "./brand.js";
import { h, mount } from "./ui.js";

const root = document.getElementById("app");
const cfg = window.FIREBASE_CONFIG ?? {};
const publicSlug = new URLSearchParams(location.search).get("c")?.trim().toLowerCase() ?? null;

if (!cfg.apiKey) {
  // Sin configuración no hay persistencia real: no se simula nada.
  renderHome(root, `${BRAND.name} todavía no está conectado a su base de datos. Completá web/firebase-config.js (ver README).`);
} else {
  const store = createStore(cfg, window.FIREBASE_EMULATORS);
  const go = (hash) => (location.hash === hash ? route() : (location.hash = hash));
  let authReady = false;

  async function route() {
    try {
      if (!authReady) return;
      const [path, qs = ""] = location.hash.replace(/^#/, "").split("?");
      const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
      const owner = store.owner();
      if (parts[0] === "login") return owner ? go("#/panel") : renderLogin(root, store, go);
      if (parts[0] === "panel") return owner ? await renderPanel(root, store, parts.slice(1), new URLSearchParams(qs), go) : go("#/login");
      closePanel();
      return renderHome(root);
    } catch (e) {
      console.error(e);
      mount(root, h("main", { class: "fatal" }, h("h1", {}, "Algo salió mal"), h("p", {}, e?.message ?? "Error inesperado."), h("a", { href: "#/", class: "btn btn-ghost" }, "Volver al inicio")));
    }
  }

  if (publicSlug !== null) {
    // La pantalla pública no depende del inicio de sesión: se muestra enseguida
    // y no se vuelve a dibujar (el cliente podría estar a mitad de puntuar).
    if (SLUG_RE.test(publicSlug)) renderPublic(root, store, publicSlug);
    else renderPublic(root, { getBusiness: async () => null }, publicSlug);
  } else {
    let lastOwner;
    store.onAuth(() => {
      authReady = true;
      const owner = store.owner()?.uid ?? null;
      if (owner === lastOwner) return;
      lastOwner = owner;
      route();
    });
    window.addEventListener("hashchange", route);
  }
}
