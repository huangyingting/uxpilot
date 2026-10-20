import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { computeInvitationStatus, generateInviteCode, normalizeInviteCode } from "@/lib/invitations";
import { normalizeEmail } from "@/lib/passwords";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Admin")) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const invitations = await prisma.accountInvitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { email: true, name: true } },
      redeemedBy: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({
    invitations: invitations.map((inv) => {
      const st = computeInvitationStatus(inv);
      return {
        id: inv.id,
        code: inv.code,
        email: inv.email,
        assignedRole: inv.assignedRole,
        invitedRole: inv.assignedRole,
        note: inv.note,
        status: st,
        effectiveStatus: st,
        expiresAt: inv.expiresAt.toISOString(),
        redeemedAt: inv.redeemedAt?.toISOString() || null,
        usedAt: inv.redeemedAt?.toISOString() || null,
        revokedAt: inv.revokedAt?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
        createdByEmail: inv.createdBy?.email || null,
        redeemedByEmail: inv.redeemedBy?.email || null,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Admin")) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const body = await req.json();
  const customCode = body.code ? normalizeInviteCode(body.code) : generateInviteCode("UXP");
  const email = body.email ? normalizeEmail(body.email) : null;
  const candidateRole = body.assignedRole || body.role;
  const assignedRole = ["Admin", "Editor", "Viewer"].includes(candidateRole)
    ? candidateRole
    : "Editor";
  const expiresInHours = Number(body.expiresInHours ?? 168);
  const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);
  const note = body.note ? String(body.note).trim() : null;

  const created = await prisma.accountInvitation.create({
    data: {
      code: customCode,
      email,
      assignedRole,
      note,
      expiresAt,
      createdByUserId: actor.id,
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "invite.create",
    targetType: "invitation",
    targetId: created.id,
    summary: `Issued single-use ${assignedRole} invitation ${created.code}${email ? ` for ${email}` : ""}`,
    metadata: { code: created.code, assignedRole, email, expiresAt: created.expiresAt.toISOString() },
  });

  return NextResponse.json(
    {
      invitation: {
        id: created.id,
        code: created.code,
        email: created.email,
        assignedRole: created.assignedRole,
        note: created.note,
        status: computeInvitationStatus(created),
        expiresAt: created.expiresAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
