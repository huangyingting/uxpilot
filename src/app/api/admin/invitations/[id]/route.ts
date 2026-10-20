import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { computeInvitationStatus } from "@/lib/invitations";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Admin")) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const action = body.action || "revoke";

  const existing = await prisma.accountInvitation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  if (action === "revoke") {
    if (existing.redeemedAt) {
      return NextResponse.json(
        { error: "Cannot revoke an invitation that has already been redeemed." },
        { status: 400 }
      );
    }
    const updated = await prisma.accountInvitation.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await recordAuditLog({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "invite.revoke",
      targetType: "invitation",
      targetId: updated.id,
      summary: `Revoked invitation code ${updated.code}`,
      metadata: { code: updated.code },
    });

    return NextResponse.json({
      invitation: {
        id: updated.id,
        code: updated.code,
        status: computeInvitationStatus(updated),
        revokedAt: updated.revokedAt?.toISOString() || null,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Admin")) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const { id } = await context.params;
  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "invite.revoke",
    targetType: "invitation",
    targetId: updated.id,
    summary: `Revoked invitation code ${updated.code}`,
  });

  return NextResponse.json({ ok: true });
}
