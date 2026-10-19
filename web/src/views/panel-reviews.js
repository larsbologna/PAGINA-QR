// Panel → Opiniones: listado con filtros, detalle, nota interna y resolución.
import { FILTERS, NOTE_MAX, RATING_LABELS, SENTIMENT_LABELS, applyFilter, isResolved, needsFollowUp, sentimentOf } from "../lib/feedback.js";
import { fmtDateTime, fmtNum, fmtRelative, h, icon, spinner, starsRow, toast } from "../ui.js";
import { errorState } from "./panel-home.js";

const PAGE = 25;

export function renderReviews(root, ctx, sub) {
  const base = `#/panel/${encodeURIComponent(ctx.slug)}/opiniones`;
  let filter = "todas";
  let shown = PAGE;
  let drawer = null; // { id, update, flush, destroy }
  let wanted = sub; // opinión pedida en la URL (puede llegar antes que los datos)
  const pendingOps = new Set(); // ids con un cambio de estado en curso

  const listEl = h("div", { class: "reviews" });
  const chips = h("div", { class: "chips", role: "group", "aria-label": "Filtrar opiniones" });
  root.replaceChildren(
    h("div", { class: "section-head" }, h("div", {}, h("h1", { class: "section-title" }, "Opiniones"), h("p", { class: "section-sub" }, icon("lock", 14), h("span", {}, "Recibidas por tu QR. Las notas internas son privadas."))), chips),
    listEl,
  );

  const href = (f, id) => `${base}${id ? `/${id}` : ""}${f && f !== "todas" ? `?f=${f}` : ""}`;

  function paintChips() {
    const all = ctx.feedback ?? [];
    chips.replaceChildren(
      ...FILTERS.map((f) =>
        h("a", { class: "chip", href: href(f.id), "aria-current": f.id === filter ? "true" : undefined }, h("span", {}, f.label), h("span", { class: "chip-count" }, ctx.feedback ? fmtNum(applyFilter(all, f.id).length) : "·")),
      ),
    );
  }

  function paintList() {
    paintChips();
    if (ctx.error && !ctx.feedback) return listEl.replaceChildren(errorState(ctx.error.message));
    if (!ctx.feedback) return listEl.replaceChildren(h("div", { class: "section-loading" }, spinner(), h("span", {}, "Cargando opiniones…")));
    const items = applyFilter(ctx.feedback, filter);
    if (!items.length) {
      const msg = ctx.feedback.length
        ? { pendientes: "No hay opiniones pendientes. Todo resuelto.", resueltas: "Todavía no marcaste opiniones como resueltas.", positivas: "Todavía no hay opiniones positivas.", negativas: "No hay opiniones negativas." }[filter] ?? "No hay opiniones con este filtro."
        : "Cuando tus clientes escaneen el QR, sus opiniones van a aparecer acá.";
      return listEl.replaceChildren(h("div", { class: "empty" }, h("span", { class: "empty-icon" }, icon(filter === "pendientes" ? "check" : "inbox", 28)), h("p", { class: "muted" }, msg)));
    }
    const visible = items.slice(0, shown);
    listEl.replaceChildren(
      h("ul", { class: "review-list" }, visible.map(row)),
      items.length > shown
        ? h(
            "button",
            {
              type: "button",
              class: "btn btn-ghost more",
              onclick: () => {
                shown += PAGE;
                paintList();
              },
            },
            `Mostrar más (${fmtNum(items.length - shown)} restantes)`,
          )
        : null,
    );
  }

  function statusPill(f) {
    if (!needsFollowUp(f)) return h("span", { class: "pill pill-none" }, "Sin problemas");
    return isResolved(f) ? h("span", { class: "pill pill-ok" }, icon("check", 14), "Resuelta") : h("span", { class: "pill pill-pending" }, icon("clock", 14), "Pendiente");
  }

  function resolveToggle(f, { big = false } = {}) {
    const id = `res-${f.id}${big ? "-d" : ""}`;
    const input = h("input", { type: "checkbox", id, checked: isResolved(f), disabled: pendingOps.has(f.id) });
    input.addEventListener("change", () => toggleResolved(f, input.checked));
    return h("label", { class: `resolve${big ? " resolve-big" : ""}`, for: id }, input, h("span", { class: "resolve-box", "aria-hidden": "true" }, icon("check", big ? 18 : 14)), h("span", { class: big ? "" : "resolve-text" }, big ? "Problema resuelto" : "Resuelta"));
  }

  async function toggleResolved(f, resolved) {
    if (pendingOps.has(f.id)) return;
    pendingOps.add(f.id);
    const prev = f.status;
    f.status = resolved ? "resolved" : "pending"; // respuesta inmediata en pantalla
    refresh();
    try {
      await ctx.store.setResolved(ctx.slug, f.id, resolved);
      toast(resolved ? "Opinión marcada como resuelta" : "La opinión volvió a pendiente");
    } catch (e) {
      f.status = prev;
      toast(e.message, "err");
    } finally {
      pendingOps.delete(f.id);
      refresh();
    }
  }

  function row(f) {
    const s = sentimentOf(f.rating);
    return h(
      "li",
      { class: `review tone-${s}${isResolved(f) && needsFollowUp(f) ? " is-resolved" : ""}`, "data-id": f.id },
      h("span", { class: `review-rail rail-${s}`, "aria-hidden": "true" }),
      h(
        "a",
        { class: "review-main", href: href(filter, f.id), "aria-label": `Abrir opinión de ${f.rating} estrellas del ${fmtDateTime(f.createdAt)}` },
        h("div", { class: "review-top" }, starsRow(f.rating, 15), h("span", { class: `badge badge-${s}` }, SENTIMENT_LABELS[s]), h("time", { class: "review-date", datetime: f.createdAt.toISOString(), title: fmtDateTime(f.createdAt) }, fmtRelative(f.createdAt))),
        h("p", { class: `review-comment${f.comment ? "" : " muted"}` }, f.comment || (f.rating === 5 ? "Puntuó con 5 estrellas" : "Sin comentario")),
        f.note ? h("p", { class: "review-note" }, icon("note", 14), h("span", {}, f.note)) : null,
      ),
      h("div", { class: "review-side" }, statusPill(f), needsFollowUp(f) ? resolveToggle(f) : null),
    );
  }

  // ── Detalle ──────────────────────────────────────────────────────
  function openDrawer(id) {
    if (drawer?.id === id) return drawer.update();
    closeDrawer();
    if (!ctx.feedback) return; // se abre cuando lleguen los datos
    const f = ctx.feedback.find((x) => x.id === id);
    if (!f) {
      wanted = null;
      toast("No encontramos esa opinión", "err");
      return ctx.go(href(filter));
    }
    const opener = document.activeElement;
    const s = sentimentOf(f.rating);
    const head = h("div", { class: "drawer-status" });
    const noteState = h("span", { class: "save-state", "aria-live": "polite" });
    const area = h("textarea", { id: "note", rows: 6, maxlength: NOTE_MAX, placeholder: "Qué pasó, con quién hablaste, qué hiciste para solucionarlo…" });
    area.value = f.note;
    const counter = h("span", { class: "counter" }, `${area.value.length}/${NOTE_MAX}`);

    let saved = f.note;
    let timer = 0;
    let saving = null;
    const setState = (kind, text) => {
      noteState.dataset.kind = kind;
      noteState.replaceChildren(kind === "saving" ? spinner("Guardando") : kind === "ok" ? icon("check", 14) : kind === "err" ? icon("alert", 14) : "", h("span", {}, text));
    };
    setState("idle", f.noteUpdatedAt ? `Guardada ${fmtRelative(f.noteUpdatedAt)}` : "Se guarda automáticamente");

    async function saveNote() {
      clearTimeout(timer);
      const value = area.value.trim();
      if (value === saved) return;
      if (saving) await saving;
      setState("saving", "Guardando…");
      saving = ctx.store
        .setNote(ctx.slug, f.id, value)
        .then(() => {
          saved = value;
          f.note = value;
          setState("ok", "Nota guardada");
          refreshList();
        })
        .catch((e) => {
          setState("err", `${e.message} Se reintentará al seguir escribiendo.`);
        })
        .finally(() => {
          saving = null;
        });
      return saving;
    }
    area.addEventListener("input", () => {
      counter.textContent = `${area.value.length}/${NOTE_MAX}`;
      setState("idle", "Cambios sin guardar…");
      clearTimeout(timer);
      timer = setTimeout(saveNote, 900);
    });
    area.addEventListener("blur", saveNote);

    const close = () => ctx.go(href(filter));
    const panel = h(
      "aside",
      { class: "drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": "drawer-title" },
      h(
        "div",
        { class: "drawer-head" },
        h("button", { type: "button", class: "icon-btn", onclick: close, "aria-label": "Cerrar detalle" }, icon("close", 20)),
        h("p", { class: "drawer-kicker" }, "Opinión recibida por el QR"),
      ),
      h(
        "div",
        { class: "drawer-body" },
        h("div", { class: `drawer-rating tone-${s}` }, h("span", { class: "drawer-score" }, String(f.rating)), h("div", {}, starsRow(f.rating, 20), h("h2", { id: "drawer-title", class: "drawer-title" }, `${RATING_LABELS[f.rating]} · ${SENTIMENT_LABELS[s]}`), h("p", { class: "muted small" }, fmtDateTime(f.createdAt)))),
        h("section", { class: "drawer-block" }, h("h3", {}, "Comentario del cliente"), h("blockquote", { class: f.comment ? "" : "muted" }, f.comment || (f.rating === 5 ? "Puntuó con 5 estrellas (no se pide comentario)." : "No dejó comentario."))),
        head,
        h(
          "section",
          { class: "drawer-block" },
          h("div", { class: "note-head" }, h("label", { for: "note" }, icon("lock", 14), " Nota interna"), noteState),
          area,
          h("div", { class: "form-meta" }, h("span", {}, "Privada: nunca se muestra al cliente ni se envía a Google."), counter),
        ),
      ),
    );
    const backdrop = h("div", { class: "drawer-backdrop", onclick: close });
    const el = h("div", { class: "drawer-layer" }, backdrop, panel);
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const focusables = [...panel.querySelectorAll("button, textarea, input, a[href]")].filter((x) => !x.disabled);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const beforeUnload = (e) => {
      if (area.value.trim() !== saved) e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.body.append(el);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => el.classList.add("open"));

    function update() {
      const cur = ctx.feedback?.find((x) => x.id === f.id);
      if (cur) f.status = pendingOps.has(f.id) ? f.status : cur.status;
      head.replaceChildren(
        needsFollowUp(f)
          ? h(
              "section",
              { class: `drawer-block resolve-block${isResolved(f) ? " done" : ""}` },
              h("h3", {}, "Seguimiento"),
              h("div", { class: "resolve-row" }, resolveToggle(f, { big: true }), statusPill(f)),
              h("p", { class: "muted small" }, isResolved(f) ? (cur?.resolvedAt ? `Resuelta el ${fmtDateTime(cur.resolvedAt)}. Podés volver a marcarla como pendiente.` : "Resuelta.") : "Cuando soluciones el problema, marcala como resuelta."),
            )
          : h("section", { class: "drawer-block" }, h("h3", {}, "Seguimiento"), h("p", { class: "muted small" }, "Las opiniones de 5 estrellas no reportan problemas, así que no necesitan resolverse.")),
      );
    }
    update();
    panel.querySelector(".icon-btn").focus();

    drawer = {
      id,
      update,
      flush: saveNote,
      destroy() {
        saveNote();
        document.removeEventListener("keydown", onKey);
        window.removeEventListener("beforeunload", beforeUnload);
        document.body.classList.remove("no-scroll");
        el.classList.remove("open");
        setTimeout(() => el.remove(), 220);
        if (opener?.isConnected) opener.focus();
        else listEl.querySelector(`[data-id="${CSS.escape(f.id)}"] a`)?.focus();
      },
    };
  }

  function closeDrawer() {
    drawer?.destroy();
    drawer = null;
  }

  function refreshList() {
    paintList();
  }
  function refresh() {
    paintList();
    drawer?.update();
  }

  function route(subId, params) {
    const f = params?.get("f");
    const nextFilter = FILTERS.some((x) => x.id === f) ? f : "todas";
    if (nextFilter !== filter) {
      filter = nextFilter;
      shown = PAGE;
      paintList();
    }
    wanted = subId;
    if (subId) openDrawer(subId);
    else closeDrawer();
  }

  filter = FILTERS.some((x) => x.id === ctx.params?.get("f")) ? ctx.params.get("f") : "todas";
  paintList();
  if (sub) openDrawer(sub);

  // Si el usuario sale de la sección, se cierra el detalle (y se guarda la nota).
  const onHash = () => {
    if (!location.hash.startsWith(base)) {
      closeDrawer();
      window.removeEventListener("hashchange", onHash);
    }
  };
  window.addEventListener("hashchange", onHash);

  return {
    route,
    update() {
      paintList();
      if (drawer) drawer.update();
      else if (wanted && ctx.feedback) openDrawer(wanted);
    },
  };
}
