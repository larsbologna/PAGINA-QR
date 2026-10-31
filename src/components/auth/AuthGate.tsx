"use client";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { enableExistingUser, friendlyAuthError, loadSession, logout, watchUser, type Session } from "@/lib/firebase/accounts";
import { CloudPresetRepository, CloudProjectRepository } from "@/lib/storage/cloud";
import { setStorageBackend } from "@/lib/storage";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/controls";
import { EditorBoot } from "@/components/editor/EditorBoot";
import { LoginScreen } from "./LoginScreen";

type State = { kind: "loading" } | { kind: "signed-out" } | { kind: "error"; message: string } | { kind: "session"; session: Session };

/** Con cuentas activadas: pide ingresar, verifica que la cuenta esté habilitada y abre el editor con sus proyectos en la nube. */
export function AuthGate() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [user, setUser] = useState<User | null>(null);

  useEffect(
    () =>
      watchUser(async (u) => {
        setUser(u);
        if (!u) {
          setStorageBackend(null);
          setState({ kind: "signed-out" });
          return;
        }
        setState({ kind: "loading" });
        try {
          const session = await loadSession(u);
          if (session.account?.active) setStorageBackend({ projects: new CloudProjectRepository(u.uid), presets: new CloudPresetRepository(u.uid) });
          setState({ kind: "session", session });
        } catch (e) {
          setState({ kind: "error", message: friendlyAuthError(e) });
        }
      }),
    [],
  );

  if (state.kind === "loading") return <Center>Cargando…</Center>;
  if (state.kind === "signed-out") return <LoginScreen />;
  if (state.kind === "error")
    return (
      <Center>
        <p className="text-red-300">{state.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => logout()}>
          Salir
        </Button>
      </Center>
    );

  const { session } = state;
  if (!session.account?.active) {
    return (
      <Center>
        <h1 className="font-display text-2xl font-bold">{session.account ? "Tu cuenta está pausada" : "Tu cuenta todavía no está habilitada"}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Ingresaste como {session.user.email}.{" "}
          {BRAND.contact ? `Para habilitarla, escribí a ${BRAND.contact}.` : "Pedile a quien te dio el acceso que la habilite."}
        </p>
        {session.isAdmin && !session.account && user && (
          <Button
            variant="primary"
            className="mt-5"
            onClick={async () => {
              await enableExistingUser(user, "Administrador");
              setState({ kind: "loading" });
              const s = await loadSession(user);
              setStorageBackend({ projects: new CloudProjectRepository(user.uid), presets: new CloudPresetRepository(user.uid) });
              setState({ kind: "session", session: s });
            }}
          >
            Habilitar mi cuenta de administrador
          </Button>
        )}
        <Button variant="ghost" className="mt-3" onClick={() => logout()}>
          Salir
        </Button>
      </Center>
    );
  }
  // key: al cambiar de cuenta se monta un editor nuevo con los proyectos de esa cuenta.
  return <EditorBoot key={session.user.uid} session={session} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-dvh place-items-center bg-bg p-6 text-center text-white">{<div className="flex flex-col items-center">{children}</div>}</div>;
}
