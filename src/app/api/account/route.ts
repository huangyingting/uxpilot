import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolveSessionActor } from "@/lib/api-auth";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json();
  const updated = await prisma.user.update({
    where: { id: actor.id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.planTier !== undefined ? { planType: String(body.planTier) } : {}),
      ...(body.planType !== undefined ? { planType: String(body.planType) } : {}),
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "account.update",
    targetType: "user",
    targetId: actor.id,
    summary: `Updated account profile (${updated.name || updated.email}, plan: ${updated.planType})`,
  });

  return NextResponse.json({ user: updated });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || "Claude Code / Cursor MCP Token").trim();
  const suffix = crypto.randomBytes(12).toString("hex");
  const tokenValue = `uxp_mcp_${suffix}`;

  const token = await prisma.mcpAccessToken.create({
    data: {
      userId: actor.id,
      name,
      tokenPrefix: "uxp_mcp_",
      tokenValue,
      status: "ACTIVE",
      lastUsedAt: new Date(),
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "mcp_token.create",
    targetType: "mcp_token",
    targetId: token.id,
    summary: `Generated MCP access token "${token.name}"`,
  });

  return NextResponse.json({ token }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Token id required." }, { status: 400 });
  }

  await prisma.mcpAccessToken.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
