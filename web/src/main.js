// Punto de entrada de la web estática (GitHub Pages).
//   index.html?c=<comercio>        página pública del QR
//   index.html#/login              ingreso
//   index.html#/panel/<comercio>   panel del comercio
//   index.html#/admin              panel maestro
import { createDemoStore } from "./store/demo.js";
import { createFirebaseStore } from "./store/firebase.js";
import { renderPublic } from "./views/public.js";
import { renderLogin } from "./views/login.js";
import { renderPanel } from "./views/panel.js";
import { renderAdmin } from "./views/admin.js";
import { renderLanding } from "./views/landing.js";
import { h, mount } from "./ui.js";

const cfg = window.FIREBASE_CONFIG ?? {};
const store = cfg.apiKey ? createFirebaseStore(cfg, window.FIREBASE_EMULATORS) : createDemoStore();
const root = document.getElementById("app");

const go = (hash) => {
  if (location.hash === hash) route();
  else location.hash = hash;
};

let authReady = false;
let publicShown = false;
store.onAuth(() => {
  authReady = true;
  // La página pública no depende de la sesión: no se vuelve a dibujar (el
  // cliente podría estar a mitad de calificar).
  if (!publicShown) route();
});

async function route() {
  try {
    const slug = new URLSearchParams(location.search).get("c");
    if (slug) {
      publicShown = true;
      return renderPublic(root, store, slug.toLowerCase());
    }
    if (!authReady) return;
    const [path, qs = ""] = location.hash.replace(/^#/, "").split("?");
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
    const params = new URLSearchParams(qs);
    const user = store.currentUser();

    if (parts[0] === "login") return user ? go("#/panel") : renderLogin(root, store, go);
    if (parts[0] === "panel") return user ? renderPanel(root, store, parts[1], parts[2], go, params) : go("#/login");
    if (parts[0] === "admin") return user ? renderAdmin(root, store, go) : go("#/login");
    return renderLanding(root, store);
  } catch (e) {
    console.error(e);
    mount(root, h("main", { class: "narrow" }, h("div", { class: "card" }, h("h1", {}, "Algo salió mal"), h("p", { class: "muted" }, e?.message ?? "Error inesperado."), h("a", { href: "#/", class: "btn-ghost" }, "Volver al inicio"))));
  }
}

window.addEventListener("hashchange", route);
// La página pública no depende del inicio de sesión: se muestra enseguida.
if (new URLSearchParams(location.search).get("c")) route();
