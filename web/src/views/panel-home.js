// Panel → Resumen: indicadores y evolución de las opiniones recibidas por el QR.
import { PERIODS, computeStats, isPending } from "../lib/feedback.js";
import { copyText, fmtNum, fmtRelative, h, icon, publicUrl, spinner, starsRow } from "../ui.js";
import { distributionChart, trendChart } from "./charts.js";

let period = "30d";

export function renderHome(root, ctx) {
  const base = `#/panel/${encodeURIComponent(ctx.slug)}`;

  function update() {
    if (ctx.error && !ctx.feedback) return root.replaceChildren(errorState(ctx.error.message));
    if (!ctx.feedback) return root.replaceChildren(h("div", { class: "section-loading" }, spinner(), h("span", {}, "Cargando opiniones…")));
    if (!ctx.feedback.length) return root.replaceChildren(emptyState(ctx));

    const p = PERIODS.find((x) => x.id === period);
    const s = computeStats(ctx.feedback, p.days);
    const pct = (n) => (s.total ? `${Math.round((n / s.total) * 100)}%` : "—");

    const periodTabs = h(
      "div",
      { class: "segmented", role: "group", "aria-label": "Período" },
      PERIODS.map((x) =>
        h(
          "button",
          {
            type: "button",
            "aria-pressed": String(x.id === period),
            onclick: () => {
              period = x.id;
              update();
            },
          },
          x.id === "todo" ? "Todo" : `Últimos ${x.label}`,
        ),
      ),
    );

    const pendingList = ctx.feedback.filter(isPending).slice(0, 3);

    root.replaceChildren(
      h(
        "div",
        { class: "section-head" },
        h("div", {}, h("h1", { class: "section-title" }, "Resumen"), h("p", { class: "section-sub" }, icon("lock", 14), h("span", {}, "Opiniones recibidas por tu QR. No es tu calificación de Google."))),
        periodTabs,
      ),
      h(
        "div",
        { class: "kpis" },
        h(
          "article",
          { class: "kpi kpi-hero" },
          h("p", { class: "kpi-label" }, "Promedio recibido"),
          h("p", { class: "kpi-value" }, s.average === null ? "—" : fmtNum(s.average, 1), h("span", { class: "kpi-unit" }, "/ 5")),
          s.average === null ? h("p", { class: "kpi-foot" }, "Sin opiniones en este período") : starsRow(Math.round(s.average), 18),
        ),
        kpi("Opiniones", fmtNum(s.total), p.days ? `en los últimos ${p.label}` : "desde el inicio"),
        kpi("Positivas", fmtNum(s.positive), `${pct(s.positive)} · 4 y 5 estrellas`, "positive"),
        kpi("Negativas", fmtNum(s.negative), `${pct(s.negative)} · 1 y 2 estrellas`, "negative"),
        h(
          "a",
          { class: `kpi kpi-link${s.pending ? " kpi-alert" : ""}`, href: `${base}/opiniones?f=pendientes` },
          h("p", { class: "kpi-label" }, "Pendientes de resolver"),
          h("p", { class: "kpi-value" }, fmtNum(s.pending)),
          h("p", { class: "kpi-foot" }, s.pending ? "Ver y resolver" : "Todo resuelto", icon("back", 14, "flip")),
        ),
      ),
      h(
        "div",
        { class: "grid-2" },
        h(
          "section",
          { class: "card chart-card" },
          h("div", { class: "card-head" }, h("h2", {}, "Evolución"), h("p", { class: "muted small" }, { day: "Por día", week: "Por semana", month: "Por mes" }[s.unit])),
          s.total ? trendChart(s.series, s.unit) : h("p", { class: "chart-empty" }, "No hubo opiniones en este período."),
        ),
        h(
          "section",
          { class: "card" },
          h("div", { class: "card-head" }, h("h2", {}, "Distribución"), h("p", { class: "muted small" }, `${fmtNum(s.neutral)} ${s.neutral === 1 ? "intermedia" : "intermedias"} (3 estrellas)`)),
          distributionChart(s.distribution),
        ),
      ),
      h(
        "section",
        { class: "card" },
        h("div", { class: "card-head" }, h("h2", {}, "Para resolver"), h("a", { class: "btn-link", href: `${base}/opiniones?f=pendientes` }, "Ver todas")),
        pendingList.length
          ? h(
              "ul",
              { class: "mini-list" },
              pendingList.map((f) =>
                h(
                  "li",
                  {},
                  h(
                    "a",
                    { href: `${base}/opiniones/${f.id}`, class: "mini-item" },
                    starsRow(f.rating, 14),
                    h("span", { class: `mini-text${f.comment ? "" : " muted"}` }, f.comment || "Sin comentario"),
                    h("span", { class: "mini-date" }, fmtRelative(f.createdAt)),
                  ),
                ),
              ),
            )
          : h("p", { class: "all-clear" }, icon("check", 18), h("span", {}, "No hay opiniones pendientes. Buen trabajo.")),
      ),
    );
  }

  update();
  return { update };
}

function kpi(label, value, foot, tone) {
  return h("article", { class: `kpi${tone ? ` kpi-${tone}` : ""}` }, h("p", { class: "kpi-label" }, tone ? h("span", { class: `dot key-${tone}` }) : null, label), h("p", { class: "kpi-value" }, value), h("p", { class: "kpi-foot" }, foot));
}

export function errorState(msg) {
  return h("div", { class: "empty" }, h("span", { class: "empty-icon tone-bad" }, icon("alert", 28)), h("h2", {}, "No pudimos cargar las opiniones"), h("p", { class: "muted" }, msg), h("button", { class: "btn btn-primary", onclick: () => location.reload() }, "Recargar"));
}

function emptyState(ctx) {
  const url = publicUrl(ctx.slug);
  return h(
    "div",
    { class: "empty empty-hero" },
    h("div", { class: "empty-art", "aria-hidden": "true" }, h("span", { class: "empty-path" }), h("span", { class: "empty-pin" }, icon("pin", 26)), h("span", { class: "empty-qr" }, icon("chat", 22))),
    h("h1", { class: "section-title" }, "Todavía no llegaron opiniones"),
    h("p", { class: "muted" }, "Cuando tus clientes escaneen el QR y puntúen su experiencia, acá vas a ver el promedio, la evolución y las opiniones para resolver."),
    h(
      "div",
      { class: "link-field" },
      h("code", {}, url),
      h("button", { type: "button", class: "btn btn-ghost small", onclick: () => copyText(url) }, icon("copy", 16), h("span", {}, "Copiar")),
      h("a", { class: "btn btn-ghost small", href: url, target: "_blank", rel: "noopener" }, icon("external", 16), h("span", {}, "Probar")),
    ),
    h("p", { class: "muted small" }, "Este es el enlace que abre tu QR."),
  );
}
