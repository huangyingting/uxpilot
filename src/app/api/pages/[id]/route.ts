import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }

  const { id } = await context.params;
  const includeSpec = {
    workstream: true,
    designSystem: true,
    groups: {
      orderBy: { orderIndex: "asc" as const },
    },
    screens: {
      orderBy: { createdAt: "asc" as const },
    },
    flowcharts: {
      orderBy: { createdAt: "desc" as const },
    },
    comments: {
      orderBy: { createdAt: "desc" as const },
    },
  };

  let page = await prisma.designPage.findUnique({
    where: { id },
    include: includeSpec,
  });

  if (!page && (id === "page-fintech-command" || id === "default")) {
    page = await prisma.designPage.findFirst({
      orderBy: { updatedAt: "desc" },
      include: includeSpec,
    });
  }

  if (!page) {
    return NextResponse.json({ error: "Design page not found." }, { status: 404 });
  }

  return NextResponse.json({
    page: {
      ...page,
      canEdit: actor ? hasMinimumRole(actor.role, "Editor") : false,
      actorRole: actor?.role || "Viewer",
      screens: page.screens.map((s) => ({
        ...s,
        versionHistory: JSON.parse(s.versionHistoryJson || "[]"),
      })),
      flowcharts: page.flowcharts.map((f) => ({
        ...f,
        graph: JSON.parse(f.nodesJson || '{"nodes":[],"edges":[]}'),
      })),
      comments: page.comments.map((c) => ({
        ...c,
        content: c.body,
        replies: JSON.parse(c.repliesJson || "[]"),
      })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to update files." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const updated = await prisma.designPage.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.globalPrompt !== undefined ? { globalPrompt: String(body.globalPrompt) } : {}),
      ...(body.isBookmarked !== undefined ? { isBookmarked: Boolean(body.isBookmarked) } : {}),
      ...(body.isShared !== undefined ? { isShared: Boolean(body.isShared) } : {}),
      ...(body.workstreamId !== undefined ? { workstreamId: body.workstreamId || null } : {}),
      ...(body.designSystemId !== undefined ? { designSystemId: body.designSystemId || null } : {}),
    },
  });

  return NextResponse.json({ page: updated });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to delete files." }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.designPage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.designPage.delete({ where: { id } });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "page.delete",
    targetType: "design_page",
    targetId: id,
    summary: `Deleted design file "${existing.name}"`,
  });

  return NextResponse.json({ ok: true });
}
