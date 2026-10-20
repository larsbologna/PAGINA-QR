// Panel privado del negocio.
//   #/panel                         elige el negocio (o entra directo si hay uno)
//   #/panel/<slug>                  Resumen
//   #/panel/<slug>/opiniones        Opiniones (?f=filtro) y /opiniones/<id> para el detalle
//   #/panel/<slug>/configuracion    Configuración
import { BRAND, brandLogo } from "../brand.js";
import { reviewArt } from "../review-art.js";
import { h, icon, logoEl, mount, spinner } from "../ui.js";
import { renderHome } from "./panel-home.js";
import { renderReviews } from "./panel-reviews.js";
import { renderSettings } from "./panel-settings.js";

const SECTIONS = [
  { id: "", label: "Resumen", icon: "home" },
  { id: "opiniones", label: "Opiniones", icon: "chat" },
  { id: "configuracion", label: "Configuración", icon: "settings" },
];

/** Estado del negocio abierto: se conserva entre secciones (sin volver a descargar). */
let ctx = null;

export function closePanel() {
  ctx?.unsub?.();
  ctx = null;
}

export async function renderPanel(root, store, parts, params, go) {
  const [slug, section = "", sub] = parts;
  if (!slug) return chooseBusiness(root, store, go);

  if (!ctx || ctx.slug !== slug) {
    closePanel();
    mount(root, h("div", { class: "panel-loading" }, spinner(), h("span", {}, "Abriendo tu panel…")));
    const [allowed, business] = await Promise.all([store.canManage(slug), store.getBusiness(slug).catch(() => null)]);
    // Sin permiso responde igual que si no existiera: no revela otros negocios.
    if (!allowed || !business) return mount(root, panelMessage(store, go, "No encontramos ese negocio", "Revisá el enlace o elegí uno de tus negocios.", h("a", { class: "btn btn-primary", href: "#/panel" }, "Ir a mis negocios")));
    ctx = { slug, business, feedback: null, error: null, view: null, store, go };
    ctx.unsub = store.watchFeedback(
      slug,
      (list) => {
        ctx.feedback = list;
        ctx.error = null;
        ctx.view?.update?.();
      },
      (e) => {
        ctx.error = e;
        ctx.view?.update?.();
      },
    );
  }
  ctx.params = params;
  ctx.setBusiness = (b) => {
    ctx.business = b;
    paintPlace();
  };

  const current = SECTIONS.some((s) => s.id === section) ? section : "";
  // Dentro de la misma sección (por ejemplo, abrir o cerrar el detalle de una
  // opinión) no se vuelve a dibujar todo: se conserva el scroll y lo escrito.
  if (ctx.section === current && ctx.view?.route && document.querySelector(".panel")) return ctx.view.route(sub, params);
  ctx.section = current;
  const content = h("div", { class: "panel-content" });
  const place = h("div", { class: "place" });
  function paintPlace() {
    const b = ctx.business;
    place.replaceChildren(
      logoEl(b, 52, "place-logo"),
      h("div", { class: "place-text" }, h("p", { class: "place-name" }, b.name), h("p", { class: "place-meta" }, icon("store", 14), h("span", {}, [b.industry, b.address].filter(Boolean).join(" · ") || "Completá rubro y dirección en Configuración"))),
    );
  }
  paintPlace();

  const nav = (cls) =>
    h(
      "nav",
      { class: cls, "aria-label": "Secciones del panel" },
      SECTIONS.map((s) =>
        h(
          "a",
          { href: `#/panel/${encodeURIComponent(slug)}${s.id ? "/" + s.id : ""}`, class: "tab", "aria-current": s.id === current ? "page" : undefined },
          icon(s.icon, 18),
          h("span", {}, s.label),
        ),
      ),
    );

  mount(
    root,
    h(
      "div",
      { class: "panel" },
      h(
        "header",
        { class: "panel-top" },
        h("div", { class: "panel-art" }, reviewArt(slug, { width: 1200, height: 260 })),
        h(
          "div",
          { class: "panel-bar" },
          brandLogo({ size: 26, href: "#/panel" }),
          h("button", { type: "button", class: "btn btn-ghost small on-art", onclick: () => logout(store, go) }, icon("logout", 16), h("span", {}, "Salir")),
        ),
        h("div", { class: "panel-place-wrap" }, place, nav("tabs")),
      ),
      h("main", { class: "panel-main", id: "contenido" }, content),
      nav("bottom-nav"),
    ),
  );

  const render = { "": renderHome, opiniones: renderReviews, configuracion: renderSettings }[current];
  ctx.view = render(content, ctx, sub);
  // El superadministrador puede volver a la lista de negocios.
  store.isAdmin().then((admin) => {
    if (admin) root.querySelector(".panel-bar .brand-logo")?.after(h("a", { class: "btn btn-ghost small on-art admin-back", href: "#/admin" }, icon("back", 16), h("span", {}, "Superadmin")));
  });
  document.title = `${SECTIONS.find((s) => s.id === current).label} · ${ctx.business.name} · ${BRAND.name}`;
}

async function chooseBusiness(root, store, go) {
  closePanel();
  mount(root, h("div", { class: "panel-loading" }, spinner(), h("span", {}, "Buscando tus negocios…")));
  if (await store.isAdmin()) return go("#/admin");
  let list;
  try {
    list = await store.myBusinesses();
  } catch (e) {
    return mount(root, panelMessage(store, go, "No pudimos cargar tus negocios", e.message ?? "", h("button", { class: "btn btn-primary", onclick: () => chooseBusiness(root, store, go) }, "Reintentar")));
  }
  if (list.length === 1) return go(`#/panel/${encodeURIComponent(list[0].slug)}`);
  if (!list.length) return mount(root, panelMessage(store, go, "Tu cuenta no tiene negocios asignados", "Pedile al administrador del servicio que vincule tu negocio a este email."));
  document.title = `Mis negocios · ${BRAND.name}`;
  mount(
    root,
    panelMessage(
      store,
      go,
      "Elegí un negocio",
      "Tu cuenta administra más de un negocio.",
      h(
        "ul",
        { class: "biz-list" },
        list.map((b) =>
          h("li", {}, h("a", { class: "biz-item", href: `#/panel/${encodeURIComponent(b.slug)}` }, logoEl(b, 40), h("span", { class: "biz-item-text" }, h("strong", {}, b.name), h("span", {}, b.industry || "")), icon("back", 18, "flip"))),
        ),
      ),
    ),
  );
}

function panelMessage(store, go, title, text, action) {
  return h(
    "div",
    { class: "auth" },
    h("div", { class: "auth-art" }, reviewArt("panel", { width: 1200, height: 800 })),
    h(
      "main",
      { class: "auth-card" },
      brandLogo({ size: 28 }),
      h("h1", { class: "auth-title" }, title),
      text ? h("p", { class: "muted" }, text) : null,
      action ?? null,
      h("button", { type: "button", class: "btn-link", onclick: () => logout(store, go) }, "Cerrar sesión"),
    ),
  );
}

async function logout(store, go) {
  closePanel();
  await store.signOut();
  go("#/login");
}
