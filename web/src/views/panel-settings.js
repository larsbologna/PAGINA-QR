// Panel → Configuración del negocio.
import { checkGoogleUrl } from "../lib/google-url.js";
import { copyText, h, icon, logoEl, publicUrl, spinner, toast } from "../ui.js";

const INDUSTRIES = ["Restaurante", "Bar", "Cafetería", "Panadería", "Heladería", "Gimnasio", "Peluquería", "Barbería", "Centro de estética", "Consultorio", "Veterinaria", "Comercio", "Supermercado", "Farmacia", "Hotel", "Lavadero", "Taller mecánico", "Inmobiliaria"];
const LOGO_MAX_CHARS = 190000;

export function renderSettings(root, ctx) {
  const b = ctx.business;
  let logo = b.logo ?? null;
  const url = publicUrl(ctx.slug);

  const field = (id, label, input, hint, extra) =>
    h("div", { class: "field" }, h("label", { for: id }, label), input, extra ?? null, hint ? h("p", { class: "hint", id: `${id}-hint` }, hint) : null, h("p", { class: "field-error", id: `${id}-error`, "aria-live": "polite" }));

  const name = h("input", { id: "name", value: b.name, maxlength: 80, required: true, autocomplete: "organization" });
  const industry = h("input", { id: "industry", value: b.industry ?? "", maxlength: 60, list: "industries", placeholder: "Ej.: Cafetería" });
  const address = h("input", { id: "address", value: b.address ?? "", maxlength: 160, placeholder: "Ej.: Av. Corrientes 1234, CABA", autocomplete: "street-address" });
  const google = h("input", { id: "google", type: "url", value: b.googleReviewUrl ?? "", maxlength: 500, placeholder: "https://g.page/r/…/review", inputmode: "url", "aria-describedby": "google-hint" });
  const test = h("a", { class: "btn btn-ghost small", target: "_blank", rel: "noopener noreferrer" }, icon("external", 16), h("span", {}, "Probar enlace"));
  const googleState = h("p", { class: "url-state", "aria-live": "polite" });

  function checkGoogle(show = true) {
    const v = google.value.trim();
    const errEl = root.querySelector("#google-error");
    if (!v) {
      test.removeAttribute("href");
      test.setAttribute("aria-disabled", "true");
      googleState.replaceChildren(icon("alert", 14), h("span", {}, "Sin enlace: tus clientes no verán el botón para reseñar en Google."));
      googleState.dataset.kind = "warn";
      if (errEl) errEl.textContent = "";
      return { ok: true, url: null };
    }
    const r = checkGoogleUrl(v);
    if (r.ok) {
      test.href = r.url;
      test.removeAttribute("aria-disabled");
      googleState.replaceChildren(icon("check", 14), h("span", {}, "Formato correcto. Probalo para confirmar que abre tu negocio."));
      googleState.dataset.kind = "ok";
      if (errEl) errEl.textContent = "";
    } else {
      test.removeAttribute("href");
      test.setAttribute("aria-disabled", "true");
      googleState.replaceChildren();
      if (errEl && show) errEl.textContent = r.error;
    }
    google.setAttribute("aria-invalid", String(!r.ok));
    return r;
  }
  google.addEventListener("input", () => checkGoogle(false));
  google.addEventListener("blur", () => checkGoogle(true));

  // Logo: se achica en el navegador a 256 px y se guarda dentro del perfil.
  const logoPreview = h("div", { class: "logo-preview" });
  const fileInput = h("input", { id: "logo", type: "file", accept: "image/png,image/jpeg,image/webp", class: "sr-only" });
  const removeBtn = h("button", { type: "button", class: "btn btn-ghost small" }, "Quitar");
  const paintLogo = () => {
    logoPreview.replaceChildren(logoEl({ name: name.value || b.name, logo }, 72));
    removeBtn.hidden = !logo;
  };
  removeBtn.addEventListener("click", () => {
    logo = null;
    paintLogo();
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    const errEl = root.querySelector("#logo-error");
    errEl.textContent = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return (errEl.textContent = "Usá una imagen PNG, JPG o WEBP.");
    if (file.size > 8 * 1024 * 1024) return (errEl.textContent = "La imagen es demasiado grande (máximo 8 MB).");
    try {
      logo = await shrinkImage(file);
      paintLogo();
    } catch {
      errEl.textContent = "No pudimos leer esa imagen. Probá con otra.";
    }
  });
  paintLogo();

  const saveBtn = h("button", { type: "submit", class: "btn btn-primary" }, h("span", {}, "Guardar cambios"));
  const formMsg = h("div", { "aria-live": "polite" });

  const form = h(
    "form",
    {
      class: "settings",
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        formMsg.replaceChildren();
        const nameErr = root.querySelector("#name-error");
        nameErr.textContent = "";
        const n = name.value.trim();
        if (n.length < 2) {
          nameErr.textContent = "El nombre debe tener al menos 2 caracteres.";
          name.setAttribute("aria-invalid", "true");
          return name.focus();
        }
        name.removeAttribute("aria-invalid");
        const g = checkGoogle(true);
        if (!g.ok) return google.focus();
        if (g.url) google.value = g.url;
        const profile = { name: n, industry: industry.value.trim(), address: address.value.trim(), logo, googleReviewUrl: g.url };
        saveBtn.disabled = true;
        saveBtn.replaceChildren(spinner("Guardando"), h("span", {}, "Guardando…"));
        try {
          await ctx.store.saveBusiness(ctx.slug, profile);
          ctx.setBusiness({ ...ctx.business, ...profile });
          toast("Cambios guardados");
          formMsg.replaceChildren(h("p", { class: "success" }, icon("check", 16), h("span", {}, "Guardado. La pantalla del QR ya usa estos datos.")));
        } catch (ex) {
          formMsg.replaceChildren(h("p", { class: "alert", role: "alert" }, icon("alert", 18), h("span", {}, `No se guardó: ${ex.message}`)));
        } finally {
          saveBtn.disabled = false;
          saveBtn.replaceChildren(h("span", {}, "Guardar cambios"));
        }
      },
    },
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", {}, "Datos del negocio"), h("p", { class: "muted small" }, "Se muestran en la pantalla que abre el QR.")),
      field("name", "Nombre del negocio", name),
      h(
        "div",
        { class: "field" },
        h("span", { class: "label" }, "Logo"),
        h("div", { class: "logo-row" }, logoPreview, h("label", { for: "logo", class: "btn btn-ghost small" }, icon("upload", 16), h("span", {}, logo ? "Cambiar logo" : "Subir logo")), removeBtn, fileInput),
        h("p", { class: "hint" }, "PNG, JPG o WEBP. Se ajusta solo a 256 × 256 px."),
        h("p", { class: "field-error", id: "logo-error", "aria-live": "polite" }),
      ),
      h("div", { class: "field-row" }, field("industry", "Rubro", industry), field("address", "Dirección (opcional)", address)),
      h("datalist", { id: "industries" }, INDUSTRIES.map((x) => h("option", { value: x }))),
    ),
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", {}, "Reseñas de Google"), h("p", { class: "muted small" }, "Adonde va el cliente para escribir su reseña pública.")),
      field(
        "google",
        "Enlace directo a tus reseñas de Google",
        google,
        "En tu Perfil de Empresa de Google, entrá a «Pedir reseñas» y copiá el enlace. Podés cambiarlo cuando quieras: el QR impreso sigue funcionando.",
        h("div", { class: "url-row" }, googleState, test),
      ),
    ),
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", {}, "Enlace de tu QR"), h("p", { class: "muted small" }, "Es fijo: el plástico QR apunta siempre a esta dirección.")),
      h(
        "div",
        { class: "link-field" },
        h("code", {}, url),
        h("button", { type: "button", class: "btn btn-ghost small", onclick: () => copyText(url) }, icon("copy", 16), h("span", {}, "Copiar")),
        h("a", { class: "btn btn-ghost small", href: url, target: "_blank", rel: "noopener" }, icon("external", 16), h("span", {}, "Abrir")),
      ),
    ),
    h("div", { class: "form-actions" }, formMsg, saveBtn),
  );

  root.replaceChildren(h("div", { class: "section-head" }, h("div", {}, h("h1", { class: "section-title" }, "Configuración"), h("p", { class: "section-sub" }, "Los datos esenciales de tu negocio."))), form);
  checkGoogle(false);
  return {};
}

async function shrinkImage(file) {
  const bmp = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d");
  // Sin WEBP (Safari viejo) se usa JPG, que no tiene transparencia: fondo blanco.
  if (!canvas.toDataURL("image/webp").startsWith("data:image/webp")) {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, size, size);
  }
  // "contain": el logo entero, centrado, sin recortar.
  const scale = Math.min(size / bmp.width, size / bmp.height);
  const w = bmp.width * scale;
  const hgt = bmp.height * scale;
  g.drawImage(bmp, (size - w) / 2, (size - hgt) / 2, w, hgt);
  for (const [type, q] of [["image/webp", 0.86], ["image/webp", 0.7], ["image/jpeg", 0.82], ["image/jpeg", 0.6]]) {
    const data = canvas.toDataURL(type, q);
    if (data.startsWith(`data:${type}`) && data.length <= LOGO_MAX_CHARS) return data;
  }
  const png = canvas.toDataURL("image/png");
  if (png.length <= LOGO_MAX_CHARS) return png;
  throw new Error("too-big");
}
