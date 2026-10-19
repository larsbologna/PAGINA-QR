// Gráficos propios en SVG (sin librerías): evolución apilada por sentimiento y
// distribución de puntuaciones. Accesibles: navegables con teclado, con
// tooltip en hover/foco y una tabla equivalente para lectores de pantalla.
import { SENTIMENT_LABELS } from "../lib/feedback.js";
import { fmtDayShort, fmtMonth, fmtNum, h, starIcon, svg } from "../ui.js";

const ORDER = ["positive", "neutral", "negative"]; // de la base hacia arriba

/** Máximo del eje con 4 marcas enteras y "redondas" (4, 8, 20, 40, 100…). */
function niceMax(v) {
  const raw = Math.max(1, Math.ceil(v / 4));
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * p).find((x) => x >= raw);
  return step * 4;
}

function bucketLabel(b, unit) {
  if (unit === "month") return fmtMonth(b.start);
  if (unit === "week") return `Semana del ${fmtDayShort(b.start)}`;
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(b.start);
}
const tickLabel = (b, unit) => (unit === "month" ? fmtMonth(b.start) : fmtDayShort(b.start));

export function trendChart(series, unit) {
  const wrap = h("div", { class: "chart" });
  const tip = h("div", { class: "chart-tip", role: "presentation", hidden: true });
  const plot = h("div", { class: "chart-plot", tabindex: "0", role: "group", "aria-label": "Evolución de opiniones. Usá las flechas para recorrer los períodos." });
  const legend = h(
    "ul",
    { class: "legend", "aria-hidden": "true" },
    ORDER.slice().reverse().map((k) => h("li", {}, h("span", { class: `key key-${k}` }), SENTIMENT_LABELS[k] + "s")),
  );
  const table = h(
    "table",
    { class: "sr-only" },
    h("caption", {}, "Opiniones por período"),
    h("thead", {}, h("tr", {}, h("th", {}, "Período"), h("th", {}, "Positivas"), h("th", {}, "Intermedias"), h("th", {}, "Negativas"), h("th", {}, "Total"))),
    h("tbody", {}, series.map((b) => h("tr", {}, h("td", {}, bucketLabel(b, unit)), h("td", {}, b.positive), h("td", {}, b.neutral), h("td", {}, b.negative), h("td", {}, b.total)))),
  );
  wrap.append(legend, plot, tip, table);

  let active = -1;
  let geom = null;

  function draw() {
    const W = Math.max(280, plot.clientWidth || 600);
    const H = 220;
    const pad = { t: 10, r: 4, b: 26, l: 30 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const max = niceMax(Math.max(1, ...series.map((s) => s.total)));
    const n = series.length;
    const slot = iw / n;
    const bw = Math.max(3, Math.min(34, slot * 0.62));
    const y = (v) => pad.t + ih - (v / max) * ih;
    const root = svg("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, "aria-hidden": "true" });

    // Grilla recesiva con 4 marcas enteras.
    const grid = svg("g", { class: "grid" });
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      grid.append(svg("line", { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: i === 0 ? "base" : "" }));
      const t = svg("text", { x: pad.l - 8, y: y(v) + 4, "text-anchor": "end" });
      t.textContent = fmtNum(v);
      grid.append(t);
    }
    root.append(grid);

    const bars = svg("g", { class: "bars" });
    const every = Math.ceil(n / Math.max(2, Math.floor(iw / 64)));
    series.forEach((b, i) => {
      const cx = pad.l + slot * i + slot / 2;
      const g = svg("g", { class: `col${i === active ? " active" : ""}` });
      let acc = 0;
      const visible = ORDER.filter((k) => b[k] > 0);
      visible.forEach((k, j) => {
        const yb = y(acc);
        acc += b[k];
        const isTop = j === visible.length - 1;
        // 2 px de separación entre segmentos; solo el extremo superior va redondeado.
        const yy = y(acc) + (isTop ? 0 : 2);
        const hh = Math.max(1, yb - yy);
        const r = isTop ? Math.min(4, bw / 2, hh) : 0;
        const x0 = cx - bw / 2;
        g.append(
          svg("path", {
            class: `seg seg-${k}`,
            d: `M${x0} ${yy + hh} V${yy + r} Q${x0} ${yy} ${x0 + r} ${yy} H${x0 + bw - r} Q${x0 + bw} ${yy} ${x0 + bw} ${yy + r} V${yy + hh} Z`,
            style: `--d:${Math.round((i / n) * 250)}ms`,
          }),
        );
      });
      bars.append(g);
      if (i % every === 0) {
        const t = svg("text", { x: cx, y: H - 6, "text-anchor": "middle", class: "tick" });
        t.textContent = tickLabel(b, unit);
        root.append(t);
      }
    });
    root.append(bars);
    // Zona de interacción: cada columna completa es el blanco (más grande que la barra).
    const hits = svg("g", { class: "hits" });
    series.forEach((_, i) => hits.append(svg("rect", { x: pad.l + slot * i, y: pad.t, width: slot, height: ih, fill: "transparent", "data-i": i })));
    root.append(hits);
    // Solo se anima la primera vez (no al redimensionar).
    if (geom) root.classList.add("static");
    plot.replaceChildren(root);
    geom = { pad, slot, W, y };
  }

  function showTip(i) {
    active = i;
    plot.querySelectorAll(".col").forEach((c, k) => c.classList.toggle("active", k === i));
    if (i < 0) {
      tip.hidden = true;
      return;
    }
    const b = series[i];
    tip.replaceChildren(
      h("p", { class: "tip-title" }, bucketLabel(b, unit)),
      h("p", { class: "tip-total" }, h("strong", {}, fmtNum(b.total)), b.total === 1 ? " opinión" : " opiniones"),
      ...ORDER.slice().reverse().map((k) => h("p", { class: "tip-row" }, h("span", { class: `tip-key key-${k}` }), h("strong", {}, fmtNum(b[k])), h("span", {}, SENTIMENT_LABELS[k] + (b[k] === 1 ? "" : "s")))),
      b.average !== null ? h("p", { class: "tip-avg" }, `Promedio ${fmtNum(b.average, 1)} ★`) : null,
    );
    tip.hidden = false;
    const x = geom.pad.l + geom.slot * i + geom.slot / 2;
    const tw = tip.offsetWidth || 160;
    const left = Math.min(Math.max(4, x - tw / 2), geom.W - tw - 4);
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(0, geom.y(b.total) - tip.offsetHeight - 10 + legend.offsetHeight)}px`;
    plot.setAttribute("aria-label", `${bucketLabel(b, unit)}: ${b.total} opiniones, ${b.positive} positivas, ${b.neutral} intermedias, ${b.negative} negativas.`);
  }

  plot.addEventListener("pointermove", (e) => {
    const r = e.target.closest?.("rect[data-i]");
    if (r) showTip(Number(r.dataset.i));
  });
  plot.addEventListener("pointerleave", () => showTip(-1));
  plot.addEventListener("blur", () => showTip(-1));
  plot.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    showTip(Math.max(0, Math.min(series.length - 1, (active < 0 ? series.length : active) + (e.key === "ArrowRight" ? 1 : -1))));
  });

  let raf = 0;
  let lastWidth = 0;
  const ro = new ResizeObserver(() => {
    // Solo se redibuja si cambió el ancho (evita ciclos de redibujo).
    const w = Math.round(plot.clientWidth);
    if (w === lastWidth) return;
    lastWidth = w;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      draw();
      if (active >= 0) showTip(active);
    });
  });
  queueMicrotask(() => {
    draw();
    ro.observe(plot);
  });
  return wrap;
}

/** Distribución 1–5: barras horizontales con valor y porcentaje visibles. */
export function distributionChart(distribution) {
  const total = distribution.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...distribution);
  return h(
    "ol",
    { class: "dist", "aria-label": "Distribución de puntuaciones" },
    [5, 4, 3, 2, 1].map((r) => {
      const v = distribution[r - 1];
      const pct = total ? Math.round((v / total) * 100) : 0;
      const tone = r <= 2 ? "negative" : r === 3 ? "neutral" : "positive";
      return h(
        "li",
        { class: "dist-row", title: `${r} estrellas: ${v} (${pct}%)` },
        h("span", { class: "dist-label" }, String(r), starIcon(true, 13)),
        h("span", { class: "dist-track" }, h("span", { class: `dist-bar seg-${tone}`, style: { "--w": `${(v / max) * 100}%` } })),
        h("span", { class: "dist-val" }, h("strong", {}, fmtNum(v)), h("span", {}, `${pct}%`)),
        h("span", { class: "sr-only" }, `${r} estrellas: ${v} opiniones, ${pct}%`),
      );
    }),
  );
}
