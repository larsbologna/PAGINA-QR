// Panel del comercio: Progreso · Para mejorar · Código QR · Configuración
import { h, mount, starsRow, STATUS_LABELS, RATING_LABELS, fmtNum, fmtDateTime, logoEl, publicUrl, toast } from "../ui.js";
import { computeStats } from "../stats.js";
import { qrDataUrl, qrSvg, download } from "../qr.js";
import { checkGoogleUrl } from "../../../src/lib/google-url.ts";

const TABS = [
  ["progreso", "Progreso"],
  ["mejorar", "Para mejorar"],
  ["qr", "Código QR"],
  ["config", "Configuración"],
];

export async function renderPanel(root, store, slug, tab, go, params) {
  mount(root, h("div", { class: "center muted pad" }, "Cargando…"));
  const [mine, isAdmin] = await Promise.all([store.myBusinesses(), store.isAdmin()]);
  if (!slug) {
    if (mine.length === 1 && !isAdmin) return go(`#/panel/${mine[0].slug}`);
    if (isAdmin) return go("#/admin");
    return mount(root, h("main", { class: "narrow" }, h("div", { class: "card" }, h("h1", {}, "Todavía no tenés comercios asignados"), h("p", { class: "muted" }, "Pedile acceso al proveedor del servicio."), h("button", { class: "btn-ghost", onclick: () => store.signOut() }, "Cerrar sesión"))));
  }
  const b = mine.find((x) => x.slug === slug);
  if (!b) return mount(root, h("main", { class: "narrow" }, h("div", { class: "card" }, h("h1", {}, "No encontramos este comercio"), h("p", { class: "muted" }, "O no tenés permiso para verlo."), h("a", { href: "#/panel", class: "btn-ghost" }, "Volver"))));

  const [feedback, clicks] = await Promise.all([store.listFeedback(slug), store.getClicks(slug)]);
  const pending = feedback.filter((f) => f.rating <= 4 && f.status !== "REVIEWED").length;
  const current = TABS.some(([k]) => k === tab) ? tab : "progreso";

  const nav = h("nav", { class: "tabs", "aria-label": "Secciones" },
    TABS.map(([k, label]) =>
      h("a", { href: `#/panel/${slug}/${k}`, class: k === current ? "active" : "", "aria-current": k === current ? "page" : undefined }, label, k === "mejorar" && pending ? h("span", { class: "badge" }, String(pending)) : null),
    ),
  );

  const header = h("header", { class: "topbar" },
    h("div", { class: "row" }, logoEl(b, 36), h("div", {}, h("strong", {}, b.name), h("div", { class: "muted small" }, store.mode === "demo" ? "DEMO" : isAdmin ? "Superadministrador" : "Administrador"))),
    h("div", { class: "row" },
      isAdmin ? h("a", { href: "#/admin", class: "btn-ghost small" }, "Panel maestro") : null,
      mine.length > 1 && !isAdmin ? h("a", { href: "#/panel", class: "btn-ghost small" }, "Cambiar") : null,
      h("button", { class: "btn-ghost small", onclick: async () => { await store.signOut(); go("#/login"); } }, "Salir"),
    ),
  );

  const content = h("section", { class: "content" });
  mount(root, store.mode === "demo" ? h("div", { class: "demo-band" }, "DEMO · Datos ficticios guardados en este navegador.") : null, header, nav, content);

  const refresh = () => renderPanel(root, store, slug, current, go, params);
  if (current === "progreso") progress(content, feedback, clicks, b, params, slug);
  else if (current === "mejorar") improve(content, store, slug, feedback, params, refresh);
  else if (current === "qr") await qr(content, b, slug);
  else config(content, store, slug, b, refresh);
}

// ── Progreso ───────────────────────────────────────────────────────────
function progress(el, feedback, clicks, b, params, slug) {
  const days = [7, 30, 90, 365].includes(Number(params.get("dias"))) ? Number(params.get("dias")) : 30;
  const s = computeStats(feedback, clicks, days);
  const delta = (cur, prev, d = 0) => {
    if (cur === null || prev === null) return h("span", { class: "muted small" }, "sin datos del período anterior");
    const diff = cur - prev;
    if (Math.abs(diff) < (d ? 0.05 : 1)) return h("span", { class: "muted small" }, "igual que el período anterior");
    return h("span", { class: `small ${diff > 0 ? "up" : "down"}` }, `${diff > 0 ? "▲ +" : "▼ −"}${fmtNum(Math.abs(diff), d)} vs. período anterior`);
  };
  const card = (label, value, extra) => h("div", { class: "stat" }, h("p", { class: "muted small" }, label), h("p", { class: "stat-value" }, value), extra);
  const max = Math.max(1, ...s.series.map((p) => p.count));

  mount(el,
    h("div", { class: "row between wrap" },
      h("h1", {}, "Tu progreso"),
      h("div", { class: "seg" }, [7, 30, 90, 365].map((d) => h("a", { href: `#/panel/${encodeURIComponent(slug)}/progreso?dias=${d}`, class: d === days ? "active" : "" }, d === 365 ? "12 meses" : `${d} días`))),
    ),
    h("div", { class: "grid4" },
      card("Opiniones recibidas", fmtNum(s.total), delta(s.total, s.prevTotal)),
      card("Calificación promedio", s.average === null ? "—" : `${fmtNum(s.average, 1)} / 5`, delta(s.average, s.prevAverage, 1)),
      card("Clientes enviados a Google", fmtNum(s.googleClicks), delta(s.googleClicks, s.prevGoogleClicks)),
      card("Para revisar", fmtNum(s.pending), h("a", { class: "small", href: `#/panel/${encodeURIComponent(slug)}/mejorar` }, "Ver opiniones →")),
    ),
    h("p", { class: "muted small" }, "Opiniones privadas recogidas con el QR. “Clientes enviados a Google” cuenta cuántas personas tocaron el botón de Google; la calificación pública de Google puede ser distinta."),
    h("div", { class: "grid2" },
      h("div", { class: "card" },
        h("h2", {}, `Opiniones por ${s.unit === "day" ? "día" : s.unit === "week" ? "semana" : "mes"}`),
        s.total
          ? h("div", { class: "bars", role: "img", "aria-label": "Cantidad de opiniones en el período" },
              s.series.map((p) => h("div", { class: "bar", title: `${p.key}: ${p.count} opiniones${p.average ? ` · promedio ${fmtNum(p.average, 1)}` : ""}` }, h("span", { style: { height: `${(p.count / max) * 100}%` } }))),
            )
          : h("p", { class: "muted" }, "Sin opiniones en este período."),
      ),
      h("div", { class: "card" },
        h("h2", {}, "Lo que más se repite"),
        h("p", { class: "muted small" }, "Motivos elegidos en opiniones de 1 a 4 estrellas"),
        s.reasons.length
          ? h("ul", { class: "hbars" }, s.reasons.map(([name, n]) => h("li", {}, h("div", { class: "row between" }, h("span", {}, name), h("strong", {}, String(n))), h("div", { class: "track" }, h("span", { style: { width: `${(n / s.reasons[0][1]) * 100}%` } })))))
          : h("p", { class: "muted" }, "Ningún motivo se repite en este período."),
      ),
    ),
    h("div", { class: "card" },
      h("h2", {}, "Distribución de puntuaciones"),
      h("ul", { class: "hbars" }, [5, 4, 3, 2, 1].map((r) => {
        const n = s.distribution[r - 1];
        return h("li", {}, h("div", { class: "row between" }, h("span", {}, `${r} ★ ${RATING_LABELS[r]}`), h("strong", {}, String(n))), h("div", { class: "track" }, h("span", { style: { width: `${s.total ? (n / s.total) * 100 : 0}%` } })));
      })),
    ),
  );
}

// ── Para mejorar ───────────────────────────────────────────────────────
function improve(el, store, slug, feedback, params, refresh) {
  const filters = [["NEW", "Nuevas"], ["IN_PROGRESS", "En seguimiento"], ["REVIEWED", "Resueltas"], ["ALL", "Todas"]];
  const sel = filters.some(([k]) => k === params.get("ver")) ? params.get("ver") : "NEW";
  const list = feedback.filter((f) => f.rating <= 4 && (sel === "ALL" || f.status === sel));
  const base = `#/panel/${encodeURIComponent(slug)}/mejorar`;

  mount(el,
    h("h1", {}, "Para mejorar"),
    h("p", { class: "muted" }, "Opiniones privadas de 1 a 4 estrellas: qué le pasó al cliente y por qué. Seguí cada caso: Nueva → En seguimiento → Resuelta."),
    h("div", { class: "seg" }, filters.map(([k, label]) => h("a", { href: `${base}?ver=${k}`, class: k === sel ? "active" : "" }, label))),
    list.length === 0
      ? h("div", { class: "card center" }, h("p", {}, sel === "NEW" ? "No hay opiniones nuevas. ¡Todo al día!" : "No hay opiniones en este estado."))
      : h("ul", { class: "stack" }, list.map((f) => item(f))),
  );

  function item(f) {
    const noteInput = h("textarea", { rows: 2, maxlength: 2000, placeholder: "Nota interna (solo la ve tu equipo)" }, f.note ?? "");
    const digits = f.contact?.phone?.replace(/\D/g, "") ?? "";
    return h("li", { class: `card fb ${f.rating <= 2 ? "bad" : "mid"}` },
      h("div", { class: "row between wrap" },
        h("div", { class: "row wrap" }, starsRow(f.rating), h("strong", {}, RATING_LABELS[f.rating]), h("span", { class: "muted small" }, fmtDateTime(f.createdAt))),
        h("div", { class: "seg small", role: "group", "aria-label": "Estado de seguimiento" },
          ["NEW", "IN_PROGRESS", "REVIEWED"].map((s) =>
            h("button", { type: "button", class: s === f.status ? `active s-${s}` : "", "aria-pressed": String(s === f.status), disabled: s === f.status, onclick: async () => {
              try { await store.setStatus(slug, f.id, s); toast(`Marcada como «${STATUS_LABELS[s]}».`); refresh(); } catch (e) { toast(e.message, "err"); }
            } }, STATUS_LABELS[s]),
          ),
        ),
      ),
      h("p", { class: "small" }, h("span", { class: "muted" }, "Motivo: "), (f.categories ?? []).length ? f.categories.map((c) => h("span", { class: "tag" }, c)) : h("span", { class: "muted" }, "no indicado")),
      f.comment ? h("p", { class: "quote" }, `“${f.comment}”`) : h("p", { class: "muted small" }, "Sin comentario"),
      f.contact
        ? h("p", { class: "contact" }, h("strong", {}, "Pidió que lo contacten: "),
            f.contact.name ? `${f.contact.name} · ` : "",
            f.contact.phone ? [h("a", { href: `tel:${digits}` }, f.contact.phone), digits.length >= 8 ? [" · ", h("a", { href: `https://wa.me/${digits}`, target: "_blank", rel: "noopener noreferrer" }, "WhatsApp")] : null] : null,
            f.contact.email ? [" · ", h("a", { href: `mailto:${f.contact.email}` }, f.contact.email)] : null)
        : null,
      h("details", {}, h("summary", { class: "small" }, f.note ? "Nota interna (editar)" : "Agregar nota interna"),
        h("div", { class: "stack" }, noteInput, h("button", { class: "btn-ghost small", onclick: async () => {
          try { await store.setNote(slug, f.id, noteInput.value.slice(0, 2000)); toast("Nota guardada."); } catch (e) { toast(e.message, "err"); }
        } }, "Guardar nota"))),
    );
  }
}

// ── Código QR ──────────────────────────────────────────────────────────
async function qr(el, b, slug) {
  const url = publicUrl(slug);
  const preview = await qrDataUrl(url, 512);
  const file = (ext, size = "") => `qr-${slug}${size ? `-${size}` : ""}.${ext}`;
  mount(el,
    h("h1", {}, "Código QR"),
    h("p", { class: "muted" }, "Apunta siempre a la misma dirección: aunque cambies el logo, los colores o el enlace de Google, el QR impreso sigue sirviendo."),
    h("div", { class: "grid2" },
      h("div", { class: "card center" }, h("img", { src: preview, alt: `Código QR que abre ${url}`, class: "qr" }), h("p", { class: "muted small break" }, url)),
      h("div", { class: "card stack" },
        h("label", { class: "small strong", for: "public-url" }, "Enlace público"),
        h("div", { class: "row" }, h("input", { id: "public-url", readonly: true, value: url }), h("button", { class: "btn-ghost", onclick: async () => { await navigator.clipboard?.writeText(url).catch(() => {}); toast("Enlace copiado."); } }, "Copiar")),
        h("a", { href: url, target: "_blank", rel: "noopener" }, "Abrir página pública ↗"),
        h("p", { class: "small strong" }, "Descargar"),
        h("div", { class: "row wrap" },
          [512, 1024, 2048].map((size) => h("button", { class: "btn-ghost", onclick: async () => download(file("png", size), await qrDataUrl(url, size)) }, `PNG ${size}px`)),
          h("button", { class: "btn", onclick: async () => download(file("svg"), `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await qrSvg(url))}`) }, "SVG (para imprenta)"),
        ),
        h("p", { class: "muted small" }, "Para plásticos y carteles usá el SVG: no pierde calidad a ningún tamaño. Tamaño mínimo impreso: 3 × 3 cm."),
      ),
    ),
  );
}

// ── Configuración ──────────────────────────────────────────────────────
function config(el, store, slug, b, refresh) {
  const msg = h("p", { class: "alert", role: "alert", hidden: true });
  const name = h("input", { id: "f-name", maxlength: 80, value: b.name });
  const color = h("input", { id: "f-color", type: "color", value: b.brandColor });
  const welcome = h("input", { id: "f-welcome", maxlength: 120, value: b.welcomeMessage });
  const thanks = h("input", { id: "f-thanks", maxlength: 200, value: b.thankYouMessage });
  const google = h("input", { id: "f-google", maxlength: 500, inputmode: "url", value: b.googleReviewUrl ?? "", placeholder: "https://g.page/r/…/review" });
  const cats = h("textarea", { id: "f-cats", rows: 6 }, (b.categories ?? []).join("\n"));
  const logo = h("input", { id: "f-logo", type: "file", accept: "image/png,image/jpeg,image/webp" });
  let logoData = b.logo ?? null;
  const logoPreview = h("div", {}, logoEl({ ...b, logo: logoData }, 64));

  logo.onchange = async () => {
    const f = logo.files?.[0];
    if (!f) return;
    try {
      logoData = await resizeImage(f, 256);
      logoPreview.replaceChildren(logoEl({ ...b, logo: logoData }, 64));
    } catch {
      toast("No se pudo leer la imagen.", "err");
    }
  };

  const field = (label, input, hint) => h("div", {}, h("label", { for: input.id, class: "small strong" }, label), input, hint ? h("p", { class: "muted small" }, hint) : null);

  mount(el,
    h("h1", {}, "Configuración"),
    h("form", { class: "card stack", onsubmit: async (e) => {
        e.preventDefault();
        msg.hidden = true;
        const g = google.value.trim();
        let googleUrl = null;
        if (g) {
          const check = checkGoogleUrl(g);
          if (!check.ok) { msg.textContent = check.error; msg.hidden = false; return; }
          googleUrl = check.url;
        }
        const categories = [...new Set(cats.value.split(/\n|,/).map((c) => c.trim()).filter(Boolean))].slice(0, 12);
        if (name.value.trim().length < 2) { msg.textContent = "El nombre es demasiado corto."; msg.hidden = false; return; }
        try {
          await store.saveBusiness(slug, {
            name: name.value.trim(),
            brandColor: color.value,
            welcomeMessage: welcome.value.trim() || "¿Cómo fue tu experiencia?",
            thankYouMessage: thanks.value.trim() || "¡Gracias!",
            googleReviewUrl: googleUrl,
            categories,
            logo: logoData,
          });
          toast("Cambios guardados.");
          refresh();
        } catch (err) {
          msg.textContent = err.message;
          msg.hidden = false;
        }
      } },
      msg,
      field("Nombre público del comercio", name),
      h("div", { class: "row" }, field("Color principal", color), h("div", {}, h("p", { class: "small strong" }, "Logo"), h("div", { class: "row" }, logoPreview, logo))),
      field("Mensaje de bienvenida", welcome),
      field("Mensaje de agradecimiento", thanks),
      field("Enlace de Google Maps (reseñas)", google, "Pegá el enlace «Pedir reseñas» de tu Perfil de Empresa de Google, el enlace de Google Maps o el Place ID."),
      field("Motivos que puede elegir el cliente (uno por línea, hasta 12)", cats),
      h("button", { type: "submit", class: "btn" }, "Guardar cambios"),
    ),
  );
}

/** Achica la imagen a un PNG cuadrado (máx. `size` px) para guardarla liviana. */
function resizeImage(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
