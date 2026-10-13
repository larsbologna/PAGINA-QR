// Panel maestro (superadministrador): alta de comercios, enlace de Google,
// activar/suspender y cuentas de los dueños.
import { h, mount, toast, publicUrl } from "../ui.js";
import { checkGoogleUrl } from "../../../src/lib/google-url.ts";
import { slugify, isValidSlug } from "../../../src/lib/slug.ts";

const DEFAULT_CATEGORIES = ["Atención", "Calidad del producto o servicio", "Tiempo de espera", "Limpieza", "Precio", "Otro"];

export async function renderAdmin(root, store, go) {
  if (!(await store.isAdmin())) return go("#/panel");
  mount(root, h("div", { class: "center muted pad" }, "Cargando…"));
  const list = (await store.listBusinesses()).sort((a, b) => a.name.localeCompare(b.name));
  const reload = () => renderAdmin(root, store, go);

  const msg = h("p", { class: "alert", role: "alert", hidden: true });
  const name = h("input", { id: "n-name", maxlength: 80, required: true });
  const slugIn = h("input", { id: "n-slug", maxlength: 60, placeholder: "se genera solo" });
  const google = h("input", { id: "n-google", maxlength: 500, inputmode: "url", placeholder: "https://g.page/r/…/review" });
  name.oninput = () => { slugIn.placeholder = slugify(name.value) || "se genera solo"; };

  const createForm = h("form", { class: "card stack", onsubmit: async (e) => {
      e.preventDefault();
      msg.hidden = true;
      const slug = (slugIn.value.trim() || slugify(name.value)).toLowerCase();
      const g = google.value.trim();
      const check = g ? checkGoogleUrl(g) : null;
      const fail = (m) => { msg.textContent = m; msg.hidden = false; };
      if (name.value.trim().length < 2) return fail("El nombre es demasiado corto.");
      if (!isValidSlug(slug)) return fail("Identificador inválido: usá letras minúsculas, números y guiones (3 a 60).");
      if (check && !check.ok) return fail(check.error);
      try {
        await store.saveBusiness(slug, {
          name: name.value.trim(),
          brandColor: "#0f766e",
          logo: null,
          welcomeMessage: "¿Cómo fue tu experiencia?",
          thankYouMessage: "¡Gracias por tomarte un momento para contarnos!",
          googleReviewUrl: check?.ok ? check.url : null,
          categories: DEFAULT_CATEGORIES,
          active: true,
        }, { isNew: true });
        toast(`Comercio «${name.value.trim()}» creado.`);
        reload();
      } catch (err) {
        fail(err.message);
      }
    } },
    h("h2", {}, "Nuevo comercio"),
    msg,
    h("div", {}, h("label", { for: "n-name", class: "small strong" }, "Nombre"), name),
    h("div", {}, h("label", { for: "n-slug", class: "small strong" }, "Identificador del enlace"), slugIn, h("p", { class: "muted small" }, "Queda en el QR: …?c=identificador. No lo cambies después de imprimir.")),
    h("div", {}, h("label", { for: "n-google", class: "small strong" }, "Enlace de Google Maps (opcional)"), google),
    h("button", { class: "btn", type: "submit" }, "Crear comercio"),
  );

  mount(root,
    store.mode === "demo" ? h("div", { class: "demo-band" }, "DEMO · Los cambios se guardan solo en este navegador.") : null,
    h("header", { class: "topbar" }, h("strong", {}, "Panel maestro"), h("button", { class: "btn-ghost small", onclick: async () => { await store.signOut(); go("#/login"); } }, "Salir")),
    h("section", { class: "content" },
      h("h1", {}, "Comercios"),
      h("div", { class: "grid2" },
        h("div", { class: "stack" }, list.length ? list.map((b) => row(b)) : h("div", { class: "card muted" }, "Todavía no creaste comercios.")),
        createForm,
      ),
    ),
  );

  function row(b) {
    const details = h("div", { class: "stack", hidden: true });
    const owners = h("p", { class: "muted small" }, "…");
    const email = h("input", { type: "email", placeholder: "email del dueño", "aria-label": "Email del dueño" });
    const pass = h("input", { type: "text", placeholder: "contraseña inicial (mín. 6)", "aria-label": "Contraseña inicial", minlength: 6 });
    const openDetails = async () => {
      details.hidden = !details.hidden;
      if (!details.hidden) {
        const a = await store.getAccess(b.slug).catch(() => ({ ownerEmails: [] }));
        owners.textContent = a.ownerEmails?.length ? `Dueños: ${a.ownerEmails.join(", ")}` : "Sin dueños asignados todavía.";
      }
    };
    details.append(
      owners,
      h("div", { class: "row wrap" }, email, pass, h("button", { class: "btn-ghost small", onclick: async () => {
        if (!email.value.trim() || (store.mode !== "demo" && pass.value.length < 6)) return toast("Completá email y una contraseña de al menos 6 caracteres.", "err");
        try {
          await store.createOwner(b.slug, email.value.trim().toLowerCase(), pass.value);
          toast("Cuenta creada. Pasale al dueño el email, la contraseña y el enlace del panel.");
          email.value = "";
          pass.value = "";
          details.hidden = true;
          await openDetails();
        } catch (err) {
          toast(err.message, "err");
        }
      } }, "Crear cuenta del dueño")),
      h("div", { class: "row wrap" },
        h("button", { class: "btn-ghost small", onclick: async () => {
          try { await store.saveBusiness(b.slug, { ...stripMeta(b), active: !b.active }); toast(b.active ? "Comercio suspendido." : "Comercio reactivado."); reload(); } catch (err) { toast(err.message, "err"); }
        } }, b.active ? "Suspender" : "Reactivar"),
        h("a", { class: "btn-ghost small", href: publicUrl(b.slug), target: "_blank", rel: "noopener" }, "Página pública ↗"),
      ),
    );
    return h("div", { class: "card" },
      h("div", { class: "row between wrap" },
        h("div", {}, h("strong", {}, b.name), " ", b.active ? h("span", { class: "tag ok" }, "Activo") : h("span", { class: "tag bad" }, "Suspendido"), b.googleReviewUrl ? null : h("span", { class: "tag warn" }, "Sin enlace de Google"),
          h("div", { class: "muted small" }, `?c=${b.slug}`)),
        h("div", { class: "row" }, h("a", { class: "btn small", href: `#/panel/${encodeURIComponent(b.slug)}` }, "Abrir panel"), h("button", { class: "btn-ghost small", onclick: openDetails }, "Opciones")),
      ),
      details,
    );
  }
}

function stripMeta(b) {
  const rest = { ...b };
  for (const k of ["slug", "createdAt", "updatedAt", "isDemo"]) delete rest[k];
  return rest;
}
