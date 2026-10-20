import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
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

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const requestedStatus =
    body.action === "revoke"
      ? "REVOKED"
      : body.action === "restore"
      ? "ACTIVE"
      : body.status;

  if (targetUser.id === actor.id && requestedStatus === "REVOKED") {
    return NextResponse.json({ error: "You cannot revoke your own active Admin account." }, { status: 400 });
  }

  const nextRole =
    body.role && ["Admin", "Editor", "Viewer"].includes(body.role)
      ? body.role
      : targetUser.role;
  const nextStatus =
    requestedStatus && ["ACTIVE", "REVOKED"].includes(requestedStatus)
      ? requestedStatus
      : targetUser.status;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: nextRole,
      status: nextStatus,
      revokedAt: nextStatus === "REVOKED" ? new Date() : null,
      revokedReason:
        nextStatus === "REVOKED"
          ? String(body.reason || "Revoked by Workspace Administrator")
          : null,
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: nextStatus !== targetUser.status ? `user.${nextStatus.toLowerCase()}` : "user.role_change",
    targetType: "user",
    targetId: updated.id,
    summary: `Updated user ${updated.email}: role=${updated.role}, status=${updated.status}`,
    metadata: {
      previousRole: targetUser.role,
      newRole: updated.role,
      previousStatus: targetUser.status,
      newStatus: updated.status,
    },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      status: updated.status,
      revokedAt: updated.revokedAt?.toISOString() || null,
      revokedReason: updated.revokedReason,
    },
  });
}
