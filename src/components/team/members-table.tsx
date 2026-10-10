import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/action-button";
import type { ActionState } from "@/lib/action-state";
import { ResetLinkButton } from "./reset-link-button";
import { formatDate, formatDateTime } from "@/lib/format";

interface Member {
  id: string;
  role: "OWNER" | "MEMBER";
  user: { email: string; name: string | null; lastLoginAt: Date | null };
}
interface Invitation {
  id: string;
  email: string;
  role: "OWNER" | "MEMBER";
  expiresAt: Date;
}

export function MembersTable({
  members,
  invitations,
  removeAction,
  revokeAction,
  resetAction,
}: {
  members: Member[];
  invitations: Invitation[];
  removeAction: (memberId: string) => () => Promise<ActionState | void>;
  revokeAction: (invitationId: string) => () => Promise<ActionState | void>;
  /** Solo para el superadministrador: generar enlace de restablecimiento de contraseña. */
  resetAction?: (memberId: string) => () => Promise<ActionState>;
}) {
  return (
    <div className="space-y-6">
      <ul className="divide-y divide-line rounded-lg border border-line">
        {members.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Todavía nadie del negocio tiene acceso.</li>}
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.user.name ?? m.user.email}</p>
              <p className="truncate text-xs text-muted">
                {m.user.name ? `${m.user.email} · ` : ""}
                {m.user.lastLoginAt ? `Último ingreso: ${formatDateTime(m.user.lastLoginAt)}` : "Nunca ingresó"}
              </p>
            </div>
            <Badge tone={m.role === "OWNER" ? "brand" : "neutral"}>{m.role === "OWNER" ? "Administrador" : "Miembro"}</Badge>
            <ActionButton action={removeAction(m.id)} pendingText="Quitando…" confirmText={`¿Quitar el acceso de ${m.user.email}?`}>
              Quitar acceso
            </ActionButton>
            {resetAction && <ResetLinkButton action={resetAction(m.id)} email={m.user.email} />}
          </li>
        ))}
      </ul>
      {invitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Invitaciones pendientes</h3>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {invitations.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.email}</p>
                  <p className="text-xs text-muted">Vence el {formatDate(i.expiresAt)}</p>
                </div>
                <Badge tone="amber">{i.role === "OWNER" ? "Administrador" : "Miembro"} · pendiente</Badge>
                <ActionButton action={revokeAction(i.id)} pendingText="Revocando…">
                  Revocar
                </ActionButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
