// Panel de superadministrador (#/admin): alta, suspensión y limpieza de negocios.
import { BRAND, brandLogo } from "../brand.js";
import { SLUG_RE } from "../lib/feedback.js";
import { checkGoogleUrl } from "../lib/google-url.js";
import { reviewArt } from "../review-art.js";
import { copyText, fmtNum, h, icon, logoEl, mount, publicUrl, spinner, toast } from "../ui.js";

export function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
}

function randomPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

/** Confirmación en un diálogo propio; si `typeToConfirm` está, hay que escribirlo para habilitar el botón. */
function confirmDialog({ title, text, confirmLabel, danger = false, typeToConfirm }) {
  return new Promise((resolve) => {
    const input = typeToConfirm ? h("input", { id: "confirm-text", autocomplete: "off", placeholder: typeToConfirm }) : null;
    const ok = h("button", { type: "submit", class: `btn ${danger ? "btn-danger" : "btn-primary"}`, disabled: !!typeToConfirm }, confirmLabel);
    const dlg = h(
      "dialog",
      { class: "dialog", "aria-labelledby": "dlg-title" },
      h(
        "form",
        { method: "dialog", class: "stack" },
        h("h2", { id: "dlg-title", class: "dialog-title" }, title),
        h("p", { class: "muted" }, text),
        input ? h("div", { class: "field" }, h("label", { for: "confirm-text" }, `Escribí «${typeToConfirm}» para confirmar`), input) : null,
        h("div", { class: "dialog-actions" }, h("button", { type: "button", class: "btn btn-ghost", onclick: () => dlg.close("cancel") }, "Cancelar"), ok),
      ),
    );
    input?.addEventListener("input", () => (ok.disabled = input.value.trim() !== typeToConfirm));
    ok.addEventListener("click", () => (dlg.returnValue = "ok"));
    dlg.addEventListener("close", () => {
      resolve(dlg.returnValue === "ok");
      dlg.remove();
    });
    document.body.append(dlg);
    dlg.showModal();
    (input ?? ok).focus();
  });
}

export async function renderAdmin(root, store, go) {
  document.title = `Superadmin · ${BRAND.name}`;
  if (!(await store.isAdmin())) {
    return mount(root, h("div", { class: "auth" }, h("main", { class: "auth-card" }, brandLogo({ size: 28 }), h("h1", { class: "auth-title" }, "Sin acceso"), h("p", { class: "muted" }, "Tu cuenta no es de superadministrador."), h("a", { class: "btn btn-primary", href: "#/panel" }, "Ir a mi panel"))));
  }

  const list = h("div", { class: "admin-list" });
  const formWrap = h("div", {});
  const counter = h("span", { class: "chip-count" }, "·");
  const newBtn = h("button", { type: "button", class: "btn btn-primary", onclick: () => toggleForm() }, icon("store", 18), h("span", {}, "Nuevo negocio"));

  mount(
    root,
    h(
      "div",
      { class: "panel" },
      h(
        "header",
        { class: "panel-top" },
        h("div", { class: "panel-art" }, reviewArt("superadmin", { width: 1200, height: 260 })),
        h(
          "div",
          { class: "panel-bar" },
          brandLogo({ size: 26, href: "#/admin" }),
          h(
            "button",
            {
              type: "button",
              class: "btn btn-ghost small on-art",
              onclick: async () => {
                await store.signOut();
                go("#/login");
              },
            },
            icon("logout", 16),
            h("span", {}, "Salir"),
          ),
        ),
      ),
      h(
        "main",
        { class: "panel-main", id: "contenido" },
        h(
          "div",
          { class: "panel-content" },
          h("div", { class: "section-head" }, h("div", {}, h("h1", { class: "section-title" }, "Negocios ", counter), h("p", { class: "section-sub" }, icon("lock", 14), h("span", {}, "Superadministrador: creá, pausá o limpiá los negocios. Cada dueño ve solo el suyo."))), newBtn),
          formWrap,
          list,
        ),
      ),
    ),
  );

  let businesses = [];

  async function load() {
    list.replaceChildren(h("div", { class: "section-loading" }, spinner(), h("span", {}, "Cargando negocios…")));
    try {
      businesses = await store.adminBusinesses();
    } catch (e) {
      return list.replaceChildren(h("p", { class: "alert", role: "alert" }, icon("alert", 18), h("span", {}, e.message)));
    }
    counter.textContent = fmtNum(businesses.length);
    if (!businesses.length) return list.replaceChildren(h("div", { class: "empty" }, h("span", { class: "empty-icon" }, icon("store", 28)), h("p", { class: "muted" }, "Todavía no hay negocios. Creá el primero con «Nuevo negocio».")));
    list.replaceChildren(h("ul", { class: "biz-cards" }, businesses.map(card)));
  }

  function card(b) {
    const count = h("strong", {}, "…");
    store.countFeedback(b.slug).then(
      (n) => (count.textContent = fmtNum(n)),
      () => (count.textContent = "—"),
    );
    const url = publicUrl(b.slug);
    const busy = (btn, fn) => async () => {
      btn.disabled = true;
      try {
        await fn();
      } catch (e) {
        toast(e.message, "err");
      } finally {
        btn.disabled = false;
      }
    };
    const toggle = h("button", { type: "button", class: "btn btn-ghost small" }, icon(b.active ? "clock" : "check", 16), h("span", {}, b.active ? "Suspender" : "Activar"));
    toggle.addEventListener(
      "click",
      busy(toggle, async () => {
        const ok = await confirmDialog({
          title: b.active ? `Suspender «${b.name}»` : `Activar «${b.name}»`,
          text: b.active ? "La pantalla del QR dejará de recibir opiniones hasta que lo actives. No se borra nada." : "La pantalla del QR vuelve a recibir opiniones.",
          confirmLabel: b.active ? "Suspender" : "Activar",
        });
        if (!ok) return;
        await store.setActive(b.slug, !b.active);
        toast(b.active ? "Negocio suspendido" : "Negocio activado");
        await load();
      }),
    );
    const clear = h("button", { type: "button", class: "btn btn-ghost small" }, icon("inbox", 16), h("span", {}, "Borrar opiniones"));
    clear.addEventListener(
      "click",
      busy(clear, async () => {
        const ok = await confirmDialog({
          title: `Borrar las opiniones de «${b.name}»`,
          text: "Se eliminan todas sus opiniones, notas y estados (por ejemplo, las de prueba antes de entregarlo). El negocio, su logo, su enlace de Google y la cuenta del dueño se conservan. No se puede deshacer.",
          confirmLabel: "Borrar opiniones",
          danger: true,
          typeToConfirm: b.slug,
        });
        if (!ok) return;
        const n = await store.clearFeedback(b.slug);
        toast(`${fmtNum(n)} ${n === 1 ? "opinión borrada" : "opiniones borradas"}`);
        count.textContent = "0";
      }),
    );
    const del = h("button", { type: "button", class: "btn btn-ghost small danger-text" }, icon("close", 16), h("span", {}, "Eliminar"));
    del.addEventListener(
      "click",
      busy(del, async () => {
        const ok = await confirmDialog({
          title: `Eliminar «${b.name}»`,
          text: "Se borran el negocio, sus opiniones y el acceso del dueño. El QR impreso dejará de funcionar. La cuenta del dueño sigue existiendo en Firebase Authentication (podés borrarla desde la consola). No se puede deshacer.",
          confirmLabel: "Eliminar negocio",
          danger: true,
          typeToConfirm: b.slug,
        });
        if (!ok) return;
        await store.deleteBusiness(b.slug);
        toast("Negocio eliminado");
        await load();
      }),
    );
    const reset = b.ownerEmails[0]
      ? h(
          "button",
          {
            type: "button",
            class: "btn-link small",
            onclick: async () => {
              try {
                await store.resetPassword(b.ownerEmails[0]);
                toast(`Enviamos a ${b.ownerEmails[0]} un email para elegir contraseña nueva`);
              } catch (e) {
                toast(e.message, "err");
              }
            },
          },
          "Enviar email de nueva contraseña",
        )
      : null;

    return h(
      "li",
      { class: `biz-card${b.active ? "" : " is-off"}`, "data-slug": b.slug },
      h(
        "div",
        { class: "biz-card-head" },
        logoEl(b, 48),
        h("div", { class: "biz-card-title" }, h("strong", {}, b.name), h("span", { class: "muted small" }, [b.industry, b.address].filter(Boolean).join(" · ") || "Sin rubro ni dirección")),
        h("span", { class: `pill ${b.active ? "pill-ok" : "pill-pending"}` }, b.active ? "Activo" : "Suspendido"),
      ),
      h(
        "dl",
        { class: "biz-card-meta" },
        h("div", {}, h("dt", {}, "Opiniones"), h("dd", {}, count)),
        h("div", {}, h("dt", {}, "Dueño"), h("dd", {}, b.ownerEmails.join(", ") || "—", reset ? h("br") : null, reset)),
        h("div", {}, h("dt", {}, "Google"), h("dd", {}, b.googleReviewUrl ? h("a", { href: b.googleReviewUrl, target: "_blank", rel: "noopener noreferrer" }, "Probar enlace") : h("span", { class: "muted" }, "Sin configurar"))),
      ),
      h("div", { class: "link-field" }, h("code", {}, url), h("button", { type: "button", class: "btn btn-ghost small", onclick: () => copyText(url) }, icon("copy", 16), h("span", {}, "Copiar"))),
      h(
        "div",
        { class: "biz-card-actions" },
        h("a", { class: "btn btn-primary small", href: `#/panel/${encodeURIComponent(b.slug)}` }, icon("home", 16), h("span", {}, "Abrir panel")),
        h("a", { class: "btn btn-ghost small", href: url, target: "_blank", rel: "noopener" }, icon("external", 16), h("span", {}, "Ver QR")),
        toggle,
        clear,
        del,
      ),
    );
  }

  function toggleForm() {
    if (formWrap.firstChild) return formWrap.replaceChildren();
    formWrap.replaceChildren(createForm());
    formWrap.querySelector("input")?.focus();
  }

  function createForm() {
    const field = (id, label, input, hint) => h("div", { class: "field" }, h("label", { for: id }, label), input, hint ? h("p", { class: "hint" }, hint) : null);
    const name = h("input", { id: "n-name", maxlength: 80, required: true, placeholder: "Ej.: Estilo Sur Barber" });
    const slug = h("input", { id: "n-slug", maxlength: 50, required: true, placeholder: "estilo-sur-barber", autocapitalize: "off", spellcheck: "false" });
    let slugTouched = false;
    name.addEventListener("input", () => {
      if (!slugTouched) slug.value = slugify(name.value);
    });
    slug.addEventListener("input", () => (slugTouched = true));
    const industry = h("input", { id: "n-industry", maxlength: 60, placeholder: "Ej.: Barbería" });
    const address = h("input", { id: "n-address", maxlength: 160, placeholder: "Opcional" });
    const google = h("input", { id: "n-google", type: "url", maxlength: 500, placeholder: "https://g.page/r/…/review (opcional)" });
    const email = h("input", { id: "n-email", type: "email", required: true, placeholder: "dueno@ejemplo.com", autocomplete: "off" });
    const pass = h("input", { id: "n-pass", value: randomPassword(), minlength: 10, required: true, autocomplete: "off" });
    const msg = h("div", { "aria-live": "polite" });
    const submit = h("button", { type: "submit", class: "btn btn-primary" }, h("span", {}, "Crear negocio"));
    const fail = (t) => msg.replaceChildren(h("p", { class: "alert", role: "alert" }, icon("alert", 18), h("span", {}, t)));

    return h(
      "form",
      {
        class: "card admin-form",
        novalidate: true,
        onsubmit: async (e) => {
          e.preventDefault();
          msg.replaceChildren();
          const s = slug.value.trim().toLowerCase();
          const em = email.value.trim().toLowerCase();
          if (name.value.trim().length < 2) return fail("El nombre debe tener al menos 2 caracteres.");
          if (!SLUG_RE.test(s)) return fail("El identificador solo puede tener minúsculas, números y guiones (ej.: estilo-sur-barber).");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || /[^\x00-\x7f]/.test(em)) return fail("El email no es válido (sin ñ ni acentos).");
          if (pass.value.length < 10) return fail("La contraseña debe tener al menos 10 caracteres.");
          let g = null;
          if (google.value.trim()) {
            const r = checkGoogleUrl(google.value);
            if (!r.ok) return fail(r.error);
            g = r.url;
          }
          submit.disabled = true;
          submit.replaceChildren(spinner("Creando"), h("span", {}, "Creando…"));
          try {
            await store.createBusiness(s, { name: name.value.trim(), industry: industry.value.trim(), address: address.value.trim(), googleReviewUrl: g }, em, pass.value);
            const url = publicUrl(s);
            const login = `${location.origin}${location.pathname}#/login`;
            const text = `Panel: ${login}\nEmail: ${em}\nContraseña: ${pass.value}\nEnlace del QR: ${url}`;
            formWrap.replaceChildren(
              h(
                "section",
                { class: "card created" },
                h("div", { class: "card-head" }, h("h2", {}, `«${name.value.trim()}» creado`), h("button", { type: "button", class: "icon-btn", "aria-label": "Cerrar", onclick: () => formWrap.replaceChildren() }, icon("close", 18))),
                h("p", { class: "success" }, icon("check", 16), h("span", {}, "Pasale estos datos al dueño. La contraseña no se vuelve a mostrar.")),
                h("pre", { class: "credentials" }, text),
                h("div", { class: "biz-card-actions" }, h("button", { type: "button", class: "btn btn-primary small", onclick: () => copyText(text) }, icon("copy", 16), h("span", {}, "Copiar todo")), h("a", { class: "btn btn-ghost small", href: url, target: "_blank", rel: "noopener" }, icon("external", 16), h("span", {}, "Ver pantalla del QR"))),
              ),
            );
            await load();
          } catch (ex) {
            fail(ex.message);
            submit.disabled = false;
            submit.replaceChildren(h("span", {}, "Crear negocio"));
          }
        },
      },
      h("div", { class: "card-head" }, h("h2", {}, "Nuevo negocio"), h("p", { class: "muted small" }, "Crea su pantalla de QR, su panel y la cuenta del dueño.")),
      h("div", { class: "field-row" }, field("n-name", "Nombre del negocio", name), field("n-slug", "Identificador del QR", slug, "Va en el enlace del QR. No conviene cambiarlo después de imprimir.")),
      h("div", { class: "field-row" }, field("n-industry", "Rubro", industry), field("n-address", "Dirección", address)),
      field("n-google", "Enlace a sus reseñas de Google", google),
      h("div", { class: "field-row" }, field("n-email", "Email del dueño", email), field("n-pass", "Contraseña inicial", pass, "Generada al azar. Podés cambiarla.")),
      msg,
      h("div", { class: "biz-card-actions" }, submit, h("button", { type: "button", class: "btn btn-ghost", onclick: () => formWrap.replaceChildren() }, "Cancelar")),
    );
  }

  await load();
}
