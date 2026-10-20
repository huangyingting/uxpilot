import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { getAIProvider } from "@/lib/ai/provider";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const pages = await prisma.designPage.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { screens: true, comments: true } },
    },
  });

  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to create design files." }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || "Untitled Design File").trim();
  const prompt = String(body.prompt || name).trim();
  const platform = body.platform === "desktop" ? "desktop" : "mobile";
  const mode = body.mode === "wireframe" ? "wireframe" : "hifi";

  const page = await prisma.designPage.create({
    data: {
      userId: actor.id,
      workstreamId: body.workstreamId || null,
      designSystemId: body.designSystemId || null,
      name,
      globalPrompt: prompt,
      platform,
      mode,
    },
  });

  const group = await prisma.screenGroup.create({
    data: {
      pageId: page.id,
      name: `${name} Core Flow`,
      sectionPrompt: prompt,
      orderIndex: 0,
    },
  });

  const provider = getAIProvider();
  const generated = await provider.generateScreens({
    prompt,
    platform,
    fidelity: mode,
    count: Number(body.screenCount || 2),
    baseScreenTitle: name,
  });

  const stepX = platform === "desktop" ? 1080 : 440;
  for (let i = 0; i < generated.screens.length; i += 1) {
    const s = generated.screens[i];
    await prisma.wireframeScreen.create({
      data: {
        pageId: page.id,
        groupId: group.id,
        name: s.name,
        screenPrompt: s.screenPrompt,
        fidelity: s.fidelity,
        platform: s.platform,
        htmlContent: s.htmlContent,
        reactCode: s.reactCode,
        x: 80 + i * stepX,
        y: 110,
        width: s.width,
        height: s.height,
        versionHistoryJson: JSON.stringify([
          {
            version: 1,
            savedAt: new Date().toISOString(),
            name: `${s.name} (v1)`,
            htmlContent: s.htmlContent,
          },
        ]),
      },
    });
  }

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "page.create",
    targetType: "design_page",
    targetId: page.id,
    summary: `Created design file "${page.name}" (${mode}, ${platform})`,
  });

  return NextResponse.json({ pageId: page.id, page }, { status: 201 });
}
