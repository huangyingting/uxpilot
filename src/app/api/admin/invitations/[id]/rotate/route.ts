import { NextRequest, NextResponse } from "next/server";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { computeInvitationStatus, rotateInvitation } from "@/lib/invitations";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
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
  try {
    const body = await req.json().catch(() => ({}));
    const expiresInHours = Math.max(1, Math.min(720, Number(body.expiresInHours) || 72));
    const rotated = await rotateInvitation(id, expiresInHours);
    const computedStatus = computeInvitationStatus(rotated);

    await recordAuditLog({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "invitation.rotate",
      targetType: "invitation",
      targetId: rotated.id,
      summary: `Rotated invitation code to ${rotated.code} (${rotated.assignedRole})`,
      metadata: {
        newCode: rotated.code,
        expiresAt: rotated.expiresAt.toISOString(),
      },
    });

    return NextResponse.json({
      ok: true,
      invitation: {
        ...rotated,
        invitedRole: rotated.assignedRole,
        status: computedStatus,
        effectiveStatus: computedStatus === "REDEEMED" ? "USED" : computedStatus,
        usedAt: rotated.redeemedAt ? rotated.redeemedAt.toISOString() : null,
        inviteUrl: `/invite/${rotated.code}`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not rotate invitation." },
      { status: 400 }
    );
  }
}
