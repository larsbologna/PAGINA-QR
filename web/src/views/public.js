// Página pública del comercio (la que abre el QR): ?c=<identificador>
import { h, mount, starIcon, RATING_LABELS, logoEl, textOn } from "../ui.js";
import { checkGoogleUrl } from "../../../src/lib/google-url.ts";

const COMMENT_MAX = 1000;

export async function renderPublic(root, store, slug) {
  mount(root, h("div", { class: "center muted pad" }, "Cargando…"));
  let b;
  try {
    b = await store.getBusiness(slug);
  } catch {
    b = null;
  }
  if (!b) {
    mount(root, h("main", { class: "public center pad" }, h("h1", {}, "No encontramos este comercio"), h("p", { class: "muted" }, "Revisá el enlace o el código QR.")));
    return;
  }
  document.title = `Tu opinión sobre ${b.name}`;
  if (!b.active) {
    mount(root, h("main", { class: "public center pad" }, logoEl(b, 64), h("h1", {}, b.name), h("p", { class: "muted" }, "Esta página de opiniones no está disponible en este momento.")));
    return;
  }

  const brand = b.brandColor || "#0f766e";
  const onBrand = textOn(brand);
  const google = b.googleReviewUrl && checkGoogleUrl(b.googleReviewUrl).ok ? b.googleReviewUrl : null;
  const state = { rating: null, comment: "", selected: new Set(), wantsContact: false, contact: { name: "", phone: "", email: "" }, sending: false, error: null };

  const shell = (...content) =>
    mount(
      root,
      b.isDemo || store.mode === "demo" ? h("div", { class: "demo-band" }, "DEMO · Página de demostración. Las opiniones se guardan solo en este navegador.") : null,
      h("div", { class: "brand-bar", style: { background: brand } }),
      h("main", { class: "public" }, h("header", { class: "center" }, logoEl(b, 72), h("p", { class: "biz-name" }, b.name)), ...content),
      h("footer", { class: "public-foot" }, `Tu opinión la recibe solo ${b.name}.`),
    );

  const trackGoogle = () => store.recordGoogleClick(slug).catch(() => undefined);
  const googleButton = (label, sameTab) =>
    h("a", { class: "btn-brand", href: google, rel: "noopener noreferrer", target: sameTab ? undefined : "_blank", style: { background: brand, color: onBrand }, onclick: trackGoogle }, label, " ↗");

  const back = () => h("button", { type: "button", class: "link muted", onclick: () => rate() }, "← Cambiar puntuación");

  function rate() {
    state.rating = null;
    const group = h("div", { class: "stars-pick", role: "radiogroup", "aria-label": "Puntuación de 1 a 5 estrellas" });
    const label = h("p", { class: "rating-label", "aria-live": "polite" }, "");
    [1, 2, 3, 4, 5].forEach((v) => {
      const btn = h(
        "button",
        { type: "button", role: "radio", "aria-checked": "false", "aria-label": `${v} ${v === 1 ? "estrella" : "estrellas"}: ${RATING_LABELS[v]}`, onclick: () => choose(v) },
        starIcon(false, 48),
      );
      btn.addEventListener("mouseenter", () => paint(v));
      btn.addEventListener("focus", () => paint(v));
      group.append(btn);
    });
    group.addEventListener("mouseleave", () => paint(0));
    group.addEventListener("keydown", (e) => {
      const cur = Number(document.activeElement?.getAttribute("aria-label")?.[0] ?? 0);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = Math.min(5, Math.max(1, cur + (e.key === "ArrowRight" ? 1 : -1)));
        group.children[next - 1].focus();
      }
    });
    function paint(n) {
      [...group.children].forEach((btn, i) => btn.firstChild.classList.toggle("on", i < n));
      label.textContent = n ? RATING_LABELS[n] : "";
    }
    shell(
      h("h1", { class: "welcome" }, b.welcomeMessage),
      h("p", { class: "center muted" }, "Tocá una estrella para calificar."),
      group,
      label,
    );
  }

  function choose(v) {
    state.rating = v;
    state.error = null;
    if (v === 5 && google) fiveStars();
    else form();
  }

  function fiveStars() {
    shell(
      h("section", { class: "center fade" },
        h("div", { class: "stars-big" }, [1, 2, 3, 4, 5].map(() => starIcon(true, 34))),
        h("h1", {}, "¡Gracias por las 5 estrellas!"),
        h("p", { class: "muted" }, `¿Nos ayudás contándolo en Google Maps? Te lleva 30 segundos y ayuda a que más personas conozcan ${b.name}.`),
        h("div", { class: "mt" },
          h("a", {
            class: "btn-brand", href: google, rel: "noopener noreferrer", style: { background: brand, color: onBrand },
            onclick: async (e) => {
              // Se guarda la puntuación y el clic ANTES de salir hacia Google (si no,
              // la navegación cortaría la escritura). Máximo 2 s de espera.
              e.preventDefault();
              const link = e.currentTarget;
              link.setAttribute("aria-busy", "true");
              link.textContent = "Abriendo Google Maps…";
              await Promise.race([
                Promise.allSettled([trackGoogle(), store.submitFeedback(slug, { rating: 5, comment: "", categories: [] })]),
                new Promise((r) => setTimeout(r, 2000)),
              ]);
              location.href = google;
            },
          }, "Continuar a Google Maps ↗"),
        ),
        h("p", { class: "mt" }, h("button", { type: "button", class: "link", style: { color: brand }, onclick: () => form() }, "Prefiero dejar un comentario privado")),
        h("p", {}, back()),
      ),
    );
  }

  function form() {
    const errorBox = h("p", { class: "alert", role: "alert", hidden: true });
    const counter = h("span", { class: "muted small" }, `${state.comment.length}/${COMMENT_MAX}`);
    const contactFields = h("div", { class: "stack", hidden: !state.wantsContact },
      field("Nombre", h("input", { id: "c-name", autocomplete: "name", maxlength: 80, value: state.contact.name, oninput: (e) => (state.contact.name = e.target.value) })),
      field("Teléfono o WhatsApp", h("input", { id: "c-phone", type: "tel", inputmode: "tel", autocomplete: "tel", maxlength: 30, value: state.contact.phone, oninput: (e) => (state.contact.phone = e.target.value) })),
      field("Email", h("input", { id: "c-email", type: "email", inputmode: "email", autocomplete: "email", maxlength: 160, value: state.contact.email, oninput: (e) => (state.contact.email = e.target.value) })),
      h("p", { class: "muted small" }, "Completá al menos el teléfono o el email."),
    );
    const submitBtn = h("button", { type: "submit", class: "btn-brand", style: { background: brand, color: onBrand } }, "Enviar opinión");

    const formEl = h("form", { class: "stack fade", novalidate: true, onsubmit: submit },
      h("div", { class: "center" },
        h("div", { class: "stars-big", role: "img", "aria-label": `${state.rating} de 5 estrellas` }, [1, 2, 3, 4, 5].map((i) => starIcon(i <= state.rating, 28))),
        h("h1", {}, state.rating === 5 ? "Contanos qué te gustó" : "Contanos qué podemos mejorar"),
        h("p", { class: "muted" }, `Tu comentario es privado: lo recibe solo ${b.name}.`),
        back(),
      ),
      h("div", {},
        h("label", { for: "comment", class: "label-lg" }, "¿Qué te pareció tu experiencia?"),
        h("textarea", { id: "comment", rows: 4, maxlength: COMMENT_MAX, placeholder: "Contanos lo que quieras…", oninput: (e) => { state.comment = e.target.value; counter.textContent = `${state.comment.length}/${COMMENT_MAX}`; } }, state.comment),
        h("div", { class: "right" }, counter),
      ),
      (b.categories ?? []).length
        ? h("fieldset", {},
            h("legend", { class: "label-lg" }, "¿Sobre qué querés contarnos?"),
            h("p", { class: "muted small" }, "Opcional. Podés elegir varias."),
            h("div", { class: "chips" }, b.categories.map((c) => {
              const on = state.selected.has(c);
              const chip = h("button", { type: "button", class: `chip${on ? " on" : ""}`, "aria-pressed": String(on), style: on ? { background: brand, color: onBrand } : {} }, c);
              chip.onclick = () => {
                const now = !state.selected.has(c);
                if (now) state.selected.add(c);
                else state.selected.delete(c);
                chip.classList.toggle("on", now);
                chip.setAttribute("aria-pressed", String(now));
                Object.assign(chip.style, now ? { background: brand, color: onBrand } : { background: "", color: "" });
              };
              return chip;
            })),
          )
        : null,
      h("fieldset", { class: "box" },
        h("label", { class: "check" },
          h("input", { type: "checkbox", checked: state.wantsContact, onchange: (e) => { state.wantsContact = e.target.checked; contactFields.hidden = !e.target.checked; } }),
          h("span", {}, h("strong", {}, "Quiero que me contacten"), h("span", { class: "muted small block" }, `Opcional. Tus datos solo los ve ${b.name} para responderte.`)),
        ),
        contactFields,
      ),
      errorBox,
      submitBtn,
      google ? h("p", { class: "center muted small" }, "¿Preferís dejar una reseña pública? ", h("a", { href: google, target: "_blank", rel: "noopener noreferrer", style: { color: brand }, onclick: trackGoogle }, "Ir a Google Maps")) : null,
    );

    async function submit(e) {
      e.preventDefault();
      if (state.sending) return;
      const c = state.contact;
      if (state.wantsContact && !c.phone.trim() && !c.email.trim()) return showError("Dejá un teléfono o un email para que puedan contactarte.");
      if (state.wantsContact && c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) return showError("El email no es válido.");
      state.sending = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando…";
      try {
        await store.submitFeedback(slug, {
          rating: state.rating,
          comment: state.comment.trim().slice(0, COMMENT_MAX),
          categories: [...state.selected].slice(0, 12),
          ...(state.wantsContact ? { contact: { consent: true, name: c.name.trim(), phone: c.phone.trim(), email: c.email.trim().toLowerCase() } } : {}),
        });
        done();
      } catch (err) {
        showError(err?.message ?? "No pudimos enviar tu opinión. Probá de nuevo.");
      } finally {
        state.sending = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar opinión";
      }
    }
    function showError(msg) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
    }
    shell(formEl);
    formEl.querySelector("h1")?.focus?.();
  }

  function done() {
    shell(
      h("section", { class: "center fade" },
        h("div", { class: "check-ok", "aria-hidden": "true" }, "✓"),
        h("h1", {}, "¡Recibimos tu opinión!"),
        h("p", { class: "muted" }, b.thankYouMessage),
        state.wantsContact ? h("p", { class: "muted small" }, `${b.name} te va a contactar con los datos que dejaste.`) : null,
        google
          ? h("div", { class: "card left mt" },
              h("p", {}, h("strong", {}, "¿Querés compartir tu experiencia en Google?")),
              h("p", { class: "muted small" }, "Es opcional. Si querés dejar una reseña pública, la escribís vos en Google Maps."),
              googleButton("Dejar reseña en Google", false),
            )
          : null,
        h("p", { class: "muted small mt" }, "Ya podés cerrar esta página cuando quieras."),
      ),
    );
  }

  rate();
}

function field(label, input) {
  return h("div", {}, h("label", { for: input.id, class: "small strong" }, label), input);
}
