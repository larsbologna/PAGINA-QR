"use client";
import { useRef, useState } from "react";
import type { Align, Project, Slide, SlideOverrides, SlideRole, VisualKind } from "@/lib/types";
import type { Recipe } from "@/lib/projectOps";
import { deleteSlide, duplicateSlide, moveSlide, updateSlide } from "@/lib/projectOps";
import { ROLE_INFO } from "@/lib/content/narrative";
import { categoryOf } from "@/lib/content/categories";
import { VISUALS, makeVisual } from "@/lib/visuals";
import { fileToDataUrl } from "@/lib/image";
import { resolveTheme } from "@/components/slide/theme";
import { Button, ColorInput, Section, Segmented, Select, Slider, TextArea, TextInput } from "@/components/ui/controls";
import { ContrastBadge } from "@/components/ui/ContrastBadge";
import { Visual } from "@/components/visuals/Visual";
import { VisualPickerDialog } from "./VisualPicker";
import { VisualFieldEditor } from "./VisualFields";
import { IconAlignCenter, IconAlignLeft, IconAlignRight, IconCopy, IconEdit, IconLayers, IconLeft, IconPalette, IconRight, IconTrash } from "@/components/ui/icons";

const ROLES = Object.keys(ROLE_INFO) as SlideRole[];

export function Inspector({
  project,
  slide,
  apply,
  onSelect,
  onOpenAiSettings,
}: {
  project: Project;
  slide: Slide;
  apply: (r: Recipe, key?: string) => void;
  onSelect: (id: string) => void;
  onOpenAiSettings: () => void;
}) {
  const index = project.slides.findIndex((s) => s.id === slide.id);
  const roleInfo = categoryOf(project.brief).roles;
  const t = resolveTheme(project.design, slide);
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState("");
  const [picking, setPicking] = useState(false);

  const set = (patch: Partial<Slide>, key?: string) => apply(updateSlide(slide.id, patch), key ? `${slide.id}.${key}` : undefined);
  const setOverride = (patch: Partial<SlideOverrides>, key?: string) =>
    apply(updateSlide(slide.id, (s) => ({ ...s, overrides: clean({ ...s.overrides, ...patch }) })), key ? `${slide.id}.o.${key}` : undefined);
  const setProp = (key: string, value: string) =>
    apply(updateSlide(slide.id, (s) => ({ ...s, visual: { ...s.visual, props: { ...s.visual.props, [key]: value } } })), `${slide.id}.v.${key}`);

  const spec = VISUALS[slide.visual.kind];
  const hasOverrides = Object.keys(slide.overrides).length > 0;

  const onFile = async (file?: File) => {
    if (!file) return;
    setImageError("");
    try {
      const image = await fileToDataUrl(file);
      apply(updateSlide(slide.id, (s) => ({ ...s, visual: { ...s.visual, image } })));
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "No se pudo cargar la imagen.");
    }
  };

  const duplicate = () => {
    const id = crypto.randomUUID();
    apply(duplicateSlide(slide.id, id));
    onSelect(id);
  };
  const remove = () => {
    const neighbor = project.slides[index + 1] ?? project.slides[index - 1];
    apply(deleteSlide(slide.id));
    if (neighbor) onSelect(neighbor.id);
  };

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent font-display text-base font-bold text-accent-ink tabular-nums">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Slide {index + 1}</div>
          <select
            aria-label="Papel del slide"
            value={slide.role}
            onChange={(e) => set({ role: e.target.value as SlideRole })}
            className="mt-0.5 cursor-pointer bg-transparent text-xs text-muted outline-none hover:text-white"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleInfo[r].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 border-b border-line px-5 py-3">
        <Button variant="outline" className="px-0" title="Mover a la izquierda" aria-label="Mover a la izquierda" disabled={index === 0} onClick={() => apply(moveSlide(slide.id, -1))}>
          <IconLeft />
        </Button>
        <Button
          variant="outline"
          className="px-0"
          title="Mover a la derecha"
          aria-label="Mover a la derecha"
          disabled={index === project.slides.length - 1}
          onClick={() => apply(moveSlide(slide.id, 1))}
        >
          <IconRight />
        </Button>
        <Button variant="outline" className="px-0" title="Duplicar" aria-label="Duplicar slide" disabled={project.slides.length >= 10} onClick={duplicate}>
          <IconCopy />
        </Button>
        <Button variant="danger" className="px-0" title="Eliminar" aria-label="Eliminar slide" disabled={project.slides.length <= 1} onClick={remove}>
          <IconTrash />
        </Button>
      </div>

      <Section title="Textos" icon={<IconEdit />}>
        <TextArea label="Título" rows={2} value={slide.title} onChange={(v) => set({ title: v }, "title")} hint="Usá *asteriscos* para resaltar y Enter para cortar línea." />
        <TextArea label="Subtítulo" rows={3} value={slide.subtitle} onChange={(v) => set({ subtitle: v }, "subtitle")} />
        <TextArea label="Texto de apoyo" rows={2} value={slide.body} onChange={(v) => set({ body: v }, "body")} />
      </Section>

      <Section title="Visual" icon={<IconLayers />}>
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted">Elemento visual</div>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-bg p-2 text-left transition hover:border-accent/60"
          >
            <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg" style={{ background: t.bg }}>
              <span className="absolute inset-1.5">{slide.visual.kind !== "none" && <Visual visual={slide.visual} t={t} d3={false} />}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{spec.label}</span>
              <span className="text-[11px] text-accent">Cambiar visual →</span>
            </span>
          </button>
        </div>
        {spec.fields.map((fld) => (
          <VisualFieldEditor
            key={fld.key}
            field={fld}
            value={slide.visual.props[fld.key] ?? ""}
            onChange={(v) => setProp(fld.key, v)}
            theme={t}
            onOpenAiSettings={onOpenAiSettings}
          />
        ))}
        {picking && (
          <VisualPickerDialog
            current={slide.visual.kind}
            theme={t}
            onClose={() => setPicking(false)}
            onPick={(k: VisualKind) => {
              apply(updateSlide(slide.id, (s) => ({ ...s, visual: { ...makeVisual(k), image: s.visual.image } })));
              setPicking(false);
            }}
          />
        )}
        {spec.usesImage && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted">Imagen</div>
            {slide.visual.image ? (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-2">
                <img src={slide.visual.image} alt="Imagen del slide" className="h-14 w-14 rounded-lg object-cover" />
                <div className="flex flex-1 flex-col gap-1">
                  <button type="button" className="text-left text-xs text-white/80 hover:text-white" onClick={() => fileInput.current?.click()}>
                    Cambiar imagen
                  </button>
                  <button
                    type="button"
                    className="text-left text-xs text-red-300/80 hover:text-red-300"
                    onClick={() => apply(updateSlide(slide.id, (s) => ({ ...s, visual: { ...s.visual, image: undefined } })))}
                  >
                    Quitar imagen
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files[0]);
                }}
                className="w-full rounded-xl border border-dashed border-line-strong px-3 py-5 text-center text-xs text-muted transition hover:border-accent hover:text-white"
              >
                Subí o arrastrá una imagen (JPG o PNG)
              </button>
            )}
            {imageError && <p className="text-xs text-red-300">{imageError}</p>}
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? undefined)} />
          </div>
        )}
      </Section>

      <Section title="Estilo de este slide" icon={<IconPalette />}>
        <Segmented<Align | "inherit">
          label="Alineación"
          value={slide.overrides.align ?? "inherit"}
          onChange={(v) => setOverride({ align: v === "inherit" ? undefined : v })}
          options={[
            { value: "inherit", label: "General", title: "Usar la alineación del diseño general" },
            { value: "left", label: <IconAlignLeft />, title: "Izquierda" },
            { value: "center", label: <IconAlignCenter />, title: "Centro" },
            { value: "right", label: <IconAlignRight />, title: "Derecha" },
          ]}
        />
        <OverrideColor label="Fondo" value={slide.overrides.background} fallback={project.design.background} onChange={(v) => setOverride({ background: v }, "bg")} />
        <OverrideColor label="Texto" value={slide.overrides.text} fallback={project.design.text} onChange={(v) => setOverride({ text: v }, "text")} />
        <OverrideColor label="Acento" value={slide.overrides.accent} fallback={project.design.accent} onChange={(v) => setOverride({ accent: v }, "accent")} />
        <div className="space-y-2 rounded-xl border border-line bg-bg/60 p-3">
          <ContrastBadge label="Texto" fg={t.text} bg={t.bg} />
          <ContrastBadge label="Acento" fg={t.accent} bg={t.bg} large />
        </div>
        <Slider label="Tamaño del título" min={0.6} max={1.4} step={0.05} value={slide.overrides.titleScale ?? 1} onChange={(v) => setOverride({ titleScale: v === 1 ? undefined : v }, "ts")} unit="×" />
        <Slider label="Tamaño de los textos" min={0.6} max={1.4} step={0.05} value={slide.overrides.textScale ?? 1} onChange={(v) => setOverride({ textScale: v === 1 ? undefined : v }, "xs")} unit="×" />
        <p className="text-[11px] leading-snug text-faint">Si el texto no entra, se achica solo para respetar el área segura.</p>
        <Button variant="ghost" className="w-full" disabled={!hasOverrides} onClick={() => apply(updateSlide(slide.id, { overrides: {} }))}>
          Volver al estilo general
        </Button>
      </Section>
    </div>
  );
}

function OverrideColor({ label, value, fallback, onChange }: { label: string; value?: string; fallback: string; onChange: (v: string | undefined) => void }) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <ColorInput label={`${label}${value ? "" : " (general)"}`} value={value ?? fallback} onChange={onChange} />
      </div>
      {value && (
        <button type="button" onClick={() => onChange(undefined)} className="mb-2 text-[11px] text-muted hover:text-white" title="Usar el color general">
          Restablecer
        </button>
      )}
    </div>
  );
}

function clean(o: SlideOverrides): SlideOverrides {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as SlideOverrides;
}
