import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Admin")) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const actionFilter = req.nextUrl.searchParams.get("action") || "";
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  const filtered = logs.filter((log) => {
    if (actionFilter && !log.action.startsWith(actionFilter)) return false;
    if (q) {
      const hay = `${log.actorEmail} ${log.action} ${log.summary} ${log.targetType}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({
    logs: filtered.map((l) => ({
      id: l.id,
      actorEmail: l.actorEmail,
      actorRole: l.actorRole,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      summary: l.summary,
      metadata: (() => {
        try {
          return JSON.parse(l.metadataJson);
        } catch {
          return {};
        }
      })(),
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
