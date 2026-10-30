"use client";
import { useId, useState, type ReactNode } from "react";

// Controles de formulario con el estilo del editor.

const inputBase =
  "w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-white placeholder:text-faint outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20";

export function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left text-[13px] font-semibold tracking-wide text-white/90 uppercase hover:text-white"
        aria-expanded={open}
      >
        {icon && <span className="text-accent">{icon}</span>}
        <span className="flex-1">{title}</span>
        {badge}
        <svg width="14" height="14" viewBox="0 0 24 24" className={`text-muted transition ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && <div className="animate-rise space-y-4 px-5 pb-5">{children}</div>}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-muted">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-[11px] leading-snug text-faint">{hint}</p>}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <input id={id} className={inputBase} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          className={`${inputBase} resize-y leading-relaxed`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; style?: React.CSSProperties }[];
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select id={id} className={`${inputBase} cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value} style={o.style}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
}) {
  return (
    <div className="space-y-1.5">
      {label && <div className="text-xs font-medium text-muted">{label}</div>}
      <div className="flex rounded-xl border border-line bg-bg p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
              value === o.value ? "bg-accent text-accent-ink shadow" : "text-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-3">
          <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
          <span className="w-14 rounded-lg border border-line bg-bg px-2 py-1 text-right text-xs tabular-nums text-white/80">
            {Number.isInteger(step) ? value : value.toFixed(2)}
            {unit}
          </span>
        </div>
      )}
    </Field>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-bg p-1.5">
          <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 shrink-0" aria-label={label} />
          <input
            className="w-full bg-transparent text-xs uppercase tabular-nums text-white/80 outline-none"
            value={draft ?? value}
            onChange={(e) => {
              setDraft(e.target.value);
              if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase());
            }}
            onBlur={() => setDraft(null)}
            aria-label={`${label} (hexadecimal)`}
          />
        </div>
      )}
    </Field>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-white/85">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-accent" : "bg-line-strong"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";

export function Button({
  variant = "outline",
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-accent text-accent-ink hover:brightness-110 shadow-[0_8px_30px_-10px_var(--ui-accent)] font-semibold",
    ghost: "text-white/80 hover:bg-white/5 hover:text-white",
    outline: "border border-line bg-panel-2 text-white/85 hover:border-line-strong hover:text-white",
    danger: "border border-red-500/30 text-red-300 hover:bg-red-500/10",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
