import type { Metadata } from "next";
import { requireManageAccess } from "@/server/auth/current";
import { listMembers } from "@/server/services/members";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { InviteForm } from "@/components/team/invite-form";
import { MembersTable } from "@/components/team/members-table";
import { inviteMemberAction, removeMemberAction, revokeInvitationAction } from "../actions";

export const metadata: Metadata = { title: "Equipo" };

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { access } = await requireManageAccess(slug);
  const b = access.business;
  const { members, invitations } = await listMembers(b.id);
  return (
    <>
      <PageHeader title="Equipo" description="Personas con acceso al panel de este negocio. Cada una ingresa con su propio usuario." />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Invitar a alguien" description="Se genera un enlace personal que vence en 7 días. Envialo por WhatsApp o email." />
          <CardBody>
            <InviteForm action={inviteMemberAction.bind(null, b.slug)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Personas con acceso" />
          <CardBody>
            <MembersTable
              members={members}
              invitations={invitations}
              removeAction={(id) => removeMemberAction.bind(null, b.slug, id)}
              revokeAction={(id) => revokeInvitationAction.bind(null, b.slug, id)}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
