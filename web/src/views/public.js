// Pantalla pública del negocio (la que abre el QR): ?c=<identificador>
import { BRAND, brandMark } from "../brand.js";
import { COMMENT_MAX, RATING_LABELS, newFeedbackId } from "../lib/feedback.js";
import { checkGoogleUrl } from "../lib/google-url.js";
import { reviewArt } from "../review-art.js";
import { h, icon, logoEl, mount, reducedMotion, spinner, starIcon } from "../ui.js";

export async function renderPublic(root, store, slug) {
  mount(root, h("div", { class: "pub-loading" }, spinner("Cargando"), h("span", {}, "Cargando…")));

  let b;
  try {
    b = await store.getBusiness(slug);
  } catch (e) {
    return mount(root, message("alert", "No pudimos cargar esta página", `${e.message}`, h("button", { class: "btn btn-primary", onclick: () => renderPublic(root, store, slug) }, "Reintentar")));
  }
  if (!b) return mount(root, message("store", "No encontramos este negocio", "Revisá el enlace o volvé a escanear el código QR."));
  document.title = `Tu opinión sobre ${b.name}`;
  if (!b.active) return mount(root, message("clock", b.name, "Esta página de opiniones no está disponible en este momento."));

  store.warmUp();
  const configuredGoogle = b.googleReviewUrl && checkGoogleUrl(b.googleReviewUrl).ok ? b.googleReviewUrl : null;
  // Un id por visita: si un envío se reintenta, no se duplica.
  const state = { rating: 0, comment: "", id: newFeedbackId(), saved: false, saving: null, locked: false };

  const stage = h("div", { class: "pub-stage" });
  const where = [b.industry, b.address].filter(Boolean).join(" · ");
  mount(
    root,
    h(
      "div",
      { class: "pub" },
      h("div", { class: "pub-art" }, reviewArt(slug)),
      h(
        "main",
        { class: "pub-sheet" },
        h("div", { class: "pub-badge" }, logoEl(b, 60)),
        h("header", { class: "pub-head" }, h("p", { class: "pub-name" }, b.name), where ? h("p", { class: "pub-where" }, icon("store", 14), h("span", {}, where)) : null),
        stage,
      ),
      h("footer", { class: "pub-foot" }, h("p", {}, `Tu opinión la recibe solo ${b.name}.`), h("p", { class: "pub-made" }, brandMark(14), `Opiniones con ${BRAND.name}`)),
    ),
  );

  let screen = 0; // cambia con cada pantalla: invalida redirecciones pendientes
  const show = (...content) => {
    screen++;
    stage.replaceChildren(h("section", { class: "screen" }, ...content));
    const focus = stage.querySelector("[data-autofocus]") ?? stage.querySelector("h1");
    focus?.focus({ preventScroll: true });
  };

  /** Guarda una sola vez; los llamados repetidos esperan el mismo envío. */
  function save() {
    if (state.saved) return Promise.resolve();
    if (!state.saving) {
      state.saving = store
        .submitFeedback(slug, state.id, { rating: state.rating, comment: state.comment.trim() })
        .then(() => {
          state.saved = true;
        })
        .finally(() => {
          state.saving = null;
        });
    }
    return state.saving;
  }

  // Única puerta hacia Google: solo existe con 5 estrellas elegidas.
  // Con 1 a 4 estrellas no se genera ningún enlace, botón ni redirección.
  const googleUrl = () => (state.rating === 5 ? configuredGoogle : null);
  const googleLink = (label) => {
    const url = googleUrl();
    return url ? h("a", { class: "btn btn-google", href: url, rel: "noopener noreferrer" }, icon("pen", 18), h("span", {}, label), icon("external", 16, "ext")) : null;
  };

  // ── 1. Puntuación ────────────────────────────────────────────────
  function rateScreen() {
    state.locked = false;
    const label = h("p", { class: "rate-label", "aria-live": "polite" }, "Tocá una estrella");
    const group = h("div", { class: "rate", role: "radiogroup", "aria-label": "Puntuación de 1 a 5 estrellas" });
    const buttons = [1, 2, 3, 4, 5].map((v) =>
      h(
        "button",
        {
          type: "button",
          class: "rate-star",
          role: "radio",
          "aria-checked": String(state.rating === v),
          "aria-label": `${v} ${v === 1 ? "estrella" : "estrellas"}: ${RATING_LABELS[v]}`,
          tabindex: (state.rating || 1) === v ? "0" : "-1",
          style: { "--i": v },
          onclick: () => choose(v),
          onmouseenter: () => paint(v),
          onfocus: () => paint(v),
        },
        starIcon(false, 52),
        h("span", { class: "rate-burst", "aria-hidden": "true" }),
      ),
    );
    group.append(...buttons);
    group.addEventListener("mouseleave", () => paint(state.rating));
    group.addEventListener("keydown", (e) => {
      const i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? i - 1 : null;
      if (next === null) return;
      e.preventDefault();
      const j = Math.max(0, Math.min(4, next));
      buttons.forEach((btn, k) => btn.setAttribute("tabindex", k === j ? "0" : "-1"));
      buttons[j].focus();
    });

    function paint(v) {
      buttons.forEach((btn, k) => btn.querySelector(".star").classList.toggle("on", k < v));
      label.textContent = v ? RATING_LABELS[v] : "Tocá una estrella";
      label.dataset.tone = v ? String(v) : "";
    }

    function choose(v) {
      if (state.locked) return; // evita dobles toques
      state.locked = true;
      state.rating = v;
      paint(v);
      buttons.forEach((btn, k) => {
        btn.setAttribute("aria-checked", String(k === v - 1));
        btn.classList.toggle("pop", k < v);
      });
      buttons[v - 1].classList.add("chosen");
      group.classList.add("decided");
      setTimeout(() => (v === 5 ? fiveScreen() : lowScreen()), reducedMotion() ? 120 : 520);
    }

    show(h("h1", { class: "pub-q", tabindex: "-1" }, "¿Cómo fue tu experiencia?"), group, label);
    if (state.rating) paint(state.rating);
  }

  // ── 2a. Cinco estrellas: gracias y a Google ─────────────────
  // Durante la cuenta regresiva se puede cambiar la puntuación: recién al
  // terminar (o al tocar el botón) se guarda la opinión y se abre Google.
  function fiveScreen() {
    const google = googleUrl();
    const mine = screen + 1;
    const onScreen = () => screen === mine && googleUrl() === google;
    const status = h("p", { class: "pub-text", "aria-live": "polite" }, google ? "Te llevamos a Google para que, si querés, publiques tu reseña." : "Guardando tu opinión…");
    const bar = h("div", { class: "go-bar", "aria-hidden": "true" }, h("span"));
    const actions = h("div", { class: "pub-actions" });
    const change = h("button", { type: "button", class: "btn-link", onclick: () => rateScreen() }, "Cambiar puntuación");
    let leaving = false;

    show(
      celebrate(),
      h("h1", { class: "pub-title", tabindex: "-1" }, "¡Gracias por tu opinión!"),
      status,
      google ? bar : null,
      actions,
      google ? h("p", { class: "pub-fine" }, icon("lock", 14), h("span", {}, `Tu puntuación la recibe ${b.name}. La reseña en Google la escribís y publicás vos, si querés.`)) : null,
      change,
    );

    /** Guarda (si hace falta) y abre Google en la misma pestaña. */
    async function go() {
      if (leaving || !onScreen()) return;
      leaving = true;
      change.remove();
      bar.remove();
      try {
        await save();
      } catch (e) {
        // Si no se pudo guardar, igual se le permite publicar en Google.
        status.replaceChildren(errorBox(e.message));
      }
      if (!onScreen()) return;
      // Navegación en la misma pestaña: no la bloquean los navegadores móviles.
      // Si igual no ocurre (navegador integrado de una app), queda el botón.
      window.location.assign(google);
      setTimeout(() => {
        if (document.visibilityState === "visible" && onScreen()) status.textContent = "¿No se abrió Google? Tocá el botón.";
        leaving = false;
      }, 2500);
    }

    if (!google) {
      save().then(
        () => {
          change.remove();
          status.textContent = `${b.name} ya recibió tu puntuación.`;
        },
        (e) => {
          status.replaceChildren(errorBox(e.message));
          actions.append(h("button", { class: "btn btn-primary", type: "button", onclick: () => fiveScreen() }, "Reintentar"));
        },
      );
      return;
    }

    const link = googleLink("Escribir mi reseña en Google");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      go();
    });
    actions.append(link);
    const wait = reducedMotion() ? 1200 : 2200;
    bar.classList.add("run");
    bar.firstChild.style.animationDuration = `${wait}ms`;
    setTimeout(go, wait);
  }

  // ── 2b. De 1 a 4 estrellas: ¿qué podríamos mejorar? ──────────────
  function lowScreen() {
    const area = h("textarea", { id: "comment", rows: 4, maxlength: COMMENT_MAX, placeholder: "Contanos qué pasó (opcional)", "data-autofocus": "" });
    area.value = state.comment;
    const counter = h("span", { class: "counter" }, `${area.value.length}/${COMMENT_MAX}`);
    area.addEventListener("input", () => {
      state.comment = area.value;
      counter.textContent = `${area.value.length}/${COMMENT_MAX}`;
    });
    const err = h("div", { "aria-live": "assertive" });
    const send = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, h("span", {}, "Enviar opinión"));

    const form = h(
      "form",
      {
        class: "pub-form",
        onsubmit: async (e) => {
          e.preventDefault();
          if (send.disabled) return;
          send.disabled = true;
          send.replaceChildren(spinner("Enviando"), h("span", {}, "Enviando…"));
          err.replaceChildren();
          try {
            await save();
            doneScreen();
          } catch (ex) {
            err.replaceChildren(errorBox(ex.message));
            send.disabled = false;
            send.replaceChildren(h("span", {}, "Reintentar"));
          }
        },
      },
      h("label", { for: "comment", class: "sr-only" }, "¿Qué podríamos mejorar? (opcional)"),
      area,
      h("div", { class: "form-meta" }, h("span", {}, "Opcional · no pedimos tus datos"), counter),
      err,
      send,
    );

    show(
      h(
        "div",
        { class: "chosen-rating" },
        h("span", { class: "stars lg", role: "img", "aria-label": `Elegiste ${state.rating} de 5 estrellas` }, [1, 2, 3, 4, 5].map((i) => starIcon(i <= state.rating, 26))),
        h("button", { type: "button", class: "btn-link", onclick: () => rateScreen() }, "Cambiar"),
      ),
      h("h1", { class: "pub-title", tabindex: "-1" }, "¿Qué podríamos mejorar?"),
      h("p", { class: "pub-text" }, `Tu comentario le llega solo al equipo de ${b.name}. No se publica.`),
      form,
    );
  }

  // ── 3. Confirmación ──────────────────────────────────────────────
  function doneScreen() {
    show(
      celebrate(),
      h("h1", { class: "pub-title", tabindex: "-1" }, "¡Gracias! Recibimos tu opinión."),
      h("p", { class: "pub-text" }, `La lee solo el equipo de ${b.name} para mejorar.`),
    );
  }

  rateScreen();
}

function celebrate() {
  return h("div", { class: "celebrate", "aria-hidden": "true" }, h("span", { class: "celebrate-ring" }), h("span", { class: "celebrate-dot" }, icon("check", 30)));
}

function errorBox(text) {
  return h("p", { class: "alert", role: "alert" }, icon("alert", 18), h("span", {}, text));
}

function message(ic, title, text, action) {
  return h(
    "div",
    { class: "pub pub-msg" },
    h("main", { class: "pub-sheet center" }, h("span", { class: "msg-icon" }, icon(ic, 28)), h("h1", { class: "pub-title" }, title), h("p", { class: "pub-text" }, text), action ?? null),
    h("footer", { class: "pub-foot" }, h("p", { class: "pub-made" }, brandMark(14), `Opiniones con ${BRAND.name}`)),
  );
}
