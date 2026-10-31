"use client";
import { useState } from "react";
import { friendlyAuthError, login, resetPassword } from "@/lib/firebase/accounts";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/controls";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await login(email, password);
    } catch (err) {
      setMsg({ ok: false, text: friendlyAuthError(err) });
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setMsg({ ok: false, text: "Escribí tu email y tocá de nuevo «Olvidé mi contraseña»." });
      return;
    }
    try {
      await resetPassword(email);
      setMsg({ ok: true, text: "Si el email tiene cuenta, te llegó un correo para elegir una contraseña nueva." });
    } catch (err) {
      setMsg({ ok: false, text: friendlyAuthError(err) });
    }
  };

  const field = "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-sm outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20";

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg p-6 text-white">
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
      <form onSubmit={submit} className="animate-rise relative w-full max-w-sm rounded-3xl border border-line bg-panel p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-ink shadow-[0_0_24px_-6px_var(--ui-accent)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <rect x="3" y="5" width="11" height="14" rx="2" />
              <path d="M17 7v10M21 9v6" />
            </svg>
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">{BRAND.name}</h1>
            <p className="text-xs text-muted">{BRAND.tagline}</p>
          </div>
        </div>
        <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="login-email">
          Email
        </label>
        <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        <label className="mt-4 mb-1.5 block text-xs font-medium text-muted" htmlFor="login-pass">
          Contraseña
        </label>
        <input id="login-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        {msg && <p className={`mt-4 rounded-xl p-3 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>}
        <Button type="submit" variant="primary" className="mt-5 w-full py-3" disabled={busy}>
          {busy ? "Ingresando…" : "Ingresar"}
        </Button>
        <button type="button" onClick={forgot} className="mt-3 w-full text-center text-xs text-muted hover:text-white">
          Olvidé mi contraseña
        </button>
        {BRAND.contact && <p className="mt-6 border-t border-line pt-4 text-center text-xs text-faint">¿No tenés cuenta? Escribí a {BRAND.contact}</p>}
      </form>
    </div>
  );
}
