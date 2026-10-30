"use client";
import type { Align, DesignConfig, ImageStyle, Project, Tone, VisualStyle } from "@/lib/types";
import type { Recipe } from "@/lib/projectOps";
import { setBrief, setDesign, setFormat, setSlideCount } from "@/lib/projectOps";
import { PALETTES } from "@/lib/defaults";
import { FONTS } from "@/lib/fonts";
import { FORMATS } from "@/lib/formats";
import { ColorInput, Section, Segmented, Select, Slider, TextArea, TextInput, Toggle } from "@/components/ui/controls";
import { ContrastBadge } from "@/components/ui/ContrastBadge";
import { DesignPresets } from "./DesignPresets";
import { IconAlignCenter, IconAlignLeft, IconAlignRight, IconFrame, IconLayers, IconPalette, IconText } from "@/components/ui/icons";

const TONES: { value: Tone; label: string }[] = [
  { value: "profesional", label: "Profesional" },
  { value: "directo", label: "Directo" },
  { value: "educativo", label: "Educativo" },
  { value: "persuasivo", label: "Persuasivo" },
  { value: "cercano", label: "Cercano" },
];

const STYLES: { value: VisualStyle; label: string }[] = [
  { value: "bold", label: "Bold · bloques de color y peso" },
  { value: "minimal", label: "Minimal · aire y líneas finas" },
  { value: "editorial", label: "Editorial · revista, filetes y serif" },
  { value: "tech", label: "Tech · grilla y brillo" },
  { value: "gradient", label: "Gradiente · auras de color" },
];

const IMAGE_STYLES: { value: ImageStyle; label: string }[] = [
  { value: "mockups", label: "Mockups" },
  { value: "3d", label: "Ilustraciones 3D" },
  { value: "diagramas", label: "Diagramas" },
  { value: "capturas", label: "Capturas simuladas" },
  { value: "graficos", label: "Gráficos" },
  { value: "fotos", label: "Fotografías" },
];

export function ConfigPanel({ project, apply }: { project: Project; apply: (r: Recipe, key?: string) => void }) {
  const { brief, design } = project;
  const b = (key: keyof typeof brief) => (v: string) => apply(setBrief({ [key]: v }), `brief.${key}`);
  const d = <K extends keyof DesignConfig>(key: K, coalesce = false) => (v: DesignConfig[K]) =>
    apply(setDesign({ [key]: v } as Partial<DesignConfig>), coalesce ? `design.${key}` : undefined);
  const activePalette = PALETTES.find((p) => p.background === design.background && p.accent === design.accent && p.text === design.text);

  return (
    <div>
      <Section title="Contenido" icon={<IconText />}>
        <TextArea label="Temática del carrusel" rows={2} value={brief.topic} onChange={b("topic")} placeholder="Ej.: Cómo conseguir más reseñas en Google" />
        <TextInput label="Nombre del negocio" value={brief.businessName} onChange={b("businessName")} placeholder="Ej.: Pizzería Don Tano" />
        <TextInput label="Objetivo comercial" value={brief.goal} onChange={b("goal")} placeholder="Ej.: que me escriban por WhatsApp" />
        <TextInput label="Público objetivo" value={brief.audience} onChange={b("audience")} placeholder="Ej.: dueños de locales gastronómicos" />
        <TextArea label="Problema que resolvemos" rows={2} value={brief.problem} onChange={b("problem")} placeholder="Ej.: el local está vacío entre semana" />
        <TextInput label="Beneficio principal" value={brief.benefit} onChange={b("benefit")} placeholder="Ej.: más clientes que llegan recomendados" />
        <TextInput label="Servicio o producto" value={brief.offer} onChange={b("offer")} placeholder="Ej.: sistema de reseñas en 7 días" />
        <TextInput label="Llamada a la acción" value={brief.cta} onChange={b("cta")} placeholder="Ej.: Escribí RESEÑAS y te paso la guía" />
        <Select label="Tono" value={brief.tone} onChange={(v) => apply(setBrief({ tone: v }))} options={TONES} />
        <TextArea
          label="Instrucciones adicionales"
          rows={4}
          value={brief.extra}
          onChange={b("extra")}
          placeholder={"Notas libres. Para usar tus propios consejos, escribilos uno por línea:\n- QR en el local: en mesa o mostrador"}
          hint="Las líneas que empiezan con guion o número se usan como consejos en la propuesta."
        />
      </Section>

      <Section title="Cantidad de slides" icon={<IconLayers />} badge={<span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">{project.slideCount}</span>}>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Cantidad de slides">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={project.slideCount === n}
              onClick={() => apply(setSlideCount(n))}
              className={`rounded-lg border py-2 text-sm font-semibold tabular-nums transition ${
                project.slideCount === n ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg text-white/70 hover:border-line-strong hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-snug text-faint">
          {project.slides.length
            ? "Con slides creados: al subir se agregan consejos antes del cierre; al bajar se quitan desde el final y el CTA se conserva."
            : "Con 10 slides: gancho, problema, ejemplo, cómo funciona, argumento, 4 consejos y CTA. Con menos, se adapta."}
        </p>
      </Section>

      <Section title="Diseño" icon={<IconPalette />}>
        <DesignPresets design={design} onApply={(saved) => apply(setDesign(saved))} />
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted">Paletas rápidas</div>
          <div className="grid grid-cols-4 gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.label}
                aria-label={`Paleta ${p.label}`}
                aria-pressed={activePalette?.id === p.id}
                onClick={() => apply(setDesign({ background: p.background, surface: p.surface, text: p.text, accent: p.accent }))}
                className={`group relative h-12 overflow-hidden rounded-xl border transition hover:scale-[1.04] ${
                  activePalette?.id === p.id ? "border-accent ring-2 ring-accent/30" : "border-line"
                }`}
                style={{ background: p.background }}
              >
                <span className="absolute bottom-1.5 left-1.5 h-3 w-6 rounded-full" style={{ background: p.accent }} />
                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold" style={{ color: p.text }}>
                  Aa
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Fondo" value={design.background} onChange={d("background", true)} />
          <ColorInput label="Superficie" value={design.surface} onChange={d("surface", true)} />
          <ColorInput label="Texto" value={design.text} onChange={d("text", true)} />
          <ColorInput label="Acento" value={design.accent} onChange={d("accent", true)} />
        </div>
        <div className="space-y-2 rounded-xl border border-line bg-bg/60 p-3">
          <div className="text-[11px] font-semibold tracking-wide text-faint uppercase">Accesibilidad (WCAG)</div>
          <ContrastBadge label="Texto sobre fondo" fg={design.text} bg={design.background} />
          <ContrastBadge label="Acento sobre fondo" fg={design.accent} bg={design.background} large />
        </div>
        <Select
          label="Tipografía de títulos"
          value={design.titleFont}
          onChange={d("titleFont")}
          options={FONTS.map((f) => ({ value: f.id, label: f.label, style: { fontFamily: f.family } }))}
        />
        <Select
          label="Tipografía secundaria"
          value={design.bodyFont}
          onChange={d("bodyFont")}
          options={FONTS.map((f) => ({ value: f.id, label: f.label, style: { fontFamily: f.family } }))}
        />
        <Slider label="Tamaño de títulos" min={64} max={180} value={design.titleSize} onChange={d("titleSize", true)} unit="px" />
        <Slider label="Tamaño de subtítulos" min={28} max={72} value={design.subtitleSize} onChange={d("subtitleSize", true)} unit="px" />
        <Slider label="Tamaño de textos de apoyo" min={22} max={48} value={design.bodySize} onChange={d("bodySize", true)} unit="px" />
        <Segmented<Align>
          label="Alineación"
          value={design.align}
          onChange={d("align")}
          options={[
            { value: "left", label: <IconAlignLeft />, title: "Izquierda" },
            { value: "center", label: <IconAlignCenter />, title: "Centro" },
            { value: "right", label: <IconAlignRight />, title: "Derecha" },
          ]}
        />
        <Segmented
          label="Títulos"
          value={design.titleCase}
          onChange={d("titleCase")}
          options={[
            { value: "upper", label: "MAYÚSCULAS" },
            { value: "normal", label: "Como lo escribo" },
          ]}
        />
        <Select label="Estilo visual" value={design.style} onChange={d("style")} options={STYLES} />
        <Slider label="Intensidad de elementos gráficos" min={0} max={100} value={design.intensity} onChange={d("intensity", true)} unit="%" />
        <Select
          label="Estilo de imágenes"
          value={design.imageStyle}
          onChange={d("imageStyle")}
          options={IMAGE_STYLES}
          hint="Define qué visual se sugiere para cada slide al proponer la estructura."
        />
        <Toggle label="Nombre y numeración en el pie" checked={design.showFooter} onChange={d("showFooter")} />
      </Section>

      <Section title="Formato" icon={<IconFrame />}>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(FORMATS).map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={project.format === f.id}
              onClick={() => apply(setFormat(f.id))}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                project.format === f.id ? "border-accent bg-accent/10" : "border-line bg-bg hover:border-line-strong"
              }`}
            >
              <span
                className={`block rounded-[4px] border-2 ${project.format === f.id ? "border-accent" : "border-white/30"}`}
                style={{ width: 36, height: (36 * f.height) / f.width }}
              />
              <span className="text-sm font-semibold">{f.label}</span>
              <span className="text-center text-[11px] leading-tight text-muted">{f.hint}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-snug text-faint">
          Márgenes de seguridad fijos: 50 px a los lados y 180 px arriba y abajo. El texto se achica solo si no entra.
        </p>
      </Section>
    </div>
  );
}
