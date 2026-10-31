"use client";
import { useEffect, useState } from "react";
import { createAccount, friendlyAuthError, listAccounts, resetPassword, updateAccount, type Account } from "@/lib/firebase/accounts";
import { BRAND } from "@/config/brand";
import { Button, TextInput } from "@/components/ui/controls";
import { IconCopy, IconPlus } from "@/components/ui/icons";

function randomPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/** Panel del administrador: alta de clientes, pausar o reactivar, y restablecer contraseñas. */
export function AdminDialog({ adminUid, onClose }: { adminUid: string; onClose: () => void }) {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: randomPassword(), note: "" });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");

  const refresh = async () => {
    try {
      setAccounts(await listAccounts());
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  };

  useEffect(() => {
    refresh();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createAccount(form, adminUid);
      setCreated({ email: form.email.trim(), password: form.password });
      setForm({ name: "", email: "", password: randomPassword(), note: "" });
      await refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (a: Account) => {
    try {
      await updateAccount(a.uid, { active: !a.active });
      await refresh();
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  };

  const accessText = created
    ? `¡Hola! Ya tenés tu acceso a ${BRAND.name}.\n\nEntrá en: ${typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}\nEmail: ${created.email}\nContraseña: ${created.password}\n\nTe recomiendo cambiar la contraseña desde el menú de tu cuenta.`
    : "";

  const shown = (accounts ?? []).filter((a) => !filter.trim() || `${a.name} ${a.email} ${a.note}`.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="admin-title" className="animate-rise flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line p-5">
          <div className="flex-1">
            <h2 id="admin-title" className="font-display text-2xl font-bold">
              Clientes
            </h2>
            <p className="text-xs text-muted">Cada cliente tiene su propio creador con sus proyectos. Solo vos podés dar de alta, pausar o reactivar cuentas.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="scroll-thin grid flex-1 gap-0 overflow-y-auto md:grid-cols-[320px_1fr]">
          <form onSubmit={create} className="space-y-3 border-b border-line p-5 md:border-r md:border-b-0">
            <div className="text-sm font-semibold">Nuevo cliente</div>
            <TextInput label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ej.: Laura Pérez" />
            <TextInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="cliente@email.com" />
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted">Contraseña inicial</div>
              <div className="flex gap-2">
                <input
                  aria-label="Contraseña inicial"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent/60"
                />
                <Button variant="ghost" onClick={() => setForm({ ...form, password: randomPassword() })} title="Generar otra">
                  ↻
                </Button>
              </div>
            </div>
            <TextInput label="Nota (opcional)" value={form.note} onChange={(v) => setForm({ ...form, note: v })} placeholder="Ej.: Pago único 31/10" />
            <Button type="submit" variant="primary" className="w-full" disabled={creating || !form.email.trim() || form.password.length < 6}>
              <IconPlus /> {creating ? "Creando…" : "Crear cuenta"}
            </Button>
            {created && (
              <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="text-xs font-semibold text-emerald-300">Cuenta creada. Mandale estos datos:</div>
                <pre className="text-[11px] leading-snug whitespace-pre-wrap text-white/85">{accessText}</pre>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await navigator.clipboard.writeText(accessText).catch(() => undefined);
                    setNotice("Datos copiados.");
                  }}
                >
                  <IconCopy /> Copiar mensaje
                </Button>
              </div>
            )}
          </form>

          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold">Cuentas {accounts ? `(${accounts.length})` : ""}</span>
              <span className="flex-1" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar…"
                aria-label="Buscar cliente"
                className="w-40 rounded-xl border border-line bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent/60"
              />
            </div>
            {error && <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            {notice && <p className="mb-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
            {!accounts && !error && <p className="text-sm text-muted">Cargando…</p>}
            <ul className="space-y-2">
              {shown.map((a) => (
                <li key={a.uid} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${a.active ? "bg-emerald-400" : "bg-white/20"}`} title={a.active ? "Activa" : "Pausada"} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.name || a.email}</div>
                    <div className="truncate text-xs text-muted">
                      {a.email}
                      {a.note ? ` · ${a.note}` : ""} · desde {new Date(a.createdAt).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        await resetPassword(a.email);
                        setNotice(`Se envió a ${a.email} un correo para elegir contraseña nueva.`);
                      } catch (e) {
                        setError(friendlyAuthError(e));
                      }
                    }}
                  >
                    Restablecer contraseña
                  </Button>
                  {a.uid !== adminUid && (
                    <Button variant={a.active ? "danger" : "outline"} className="text-xs" onClick={() => toggle(a)}>
                      {a.active ? "Pausar" : "Reactivar"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
