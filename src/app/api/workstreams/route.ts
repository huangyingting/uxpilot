import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to create folders." }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  const folder = await prisma.workstream.create({
    data: {
      userId: actor.id,
      name,
      description: body.description ? String(body.description).trim() : null,
      color: body.color || "#6366f1",
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "workstream.create",
    targetType: "workstream",
    targetId: folder.id,
    summary: `Created folder "${folder.name}"`,
  });

  return NextResponse.json({ workstream: folder }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to delete folders." }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Folder id is required." }, { status: 400 });
  }

  await prisma.workstream.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
