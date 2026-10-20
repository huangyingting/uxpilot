import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to generate screens." }, { status: 403 });
  }

  const body = await req.json();
  const prompt = String(body.prompt || "Modern FinTech Dashboard").trim();
  const platform = body.platform === "desktop" ? "desktop" : "mobile";
  const fidelity = body.fidelity === "wireframe" ? "wireframe" : "hifi";
  const generationKind = body.generationKind || "standard";
  const count = Number(body.count || (generationKind === "variations" ? 4 : 2));

  const provider = getAIProvider(body.providerOverride);

  // Flowchart generation branch
  if (body.kind === "flowchart") {
    const fcResult = await provider.generateFlowchart({
      prompt,
      pageTitle: body.pageTitle || prompt.slice(0, 32),
    });

    let savedFlowchart = null;
    if (body.pageId) {
      savedFlowchart = await prisma.canvasFlowchart.create({
        data: {
          pageId: body.pageId,
          title: fcResult.flowchart.title,
          prompt,
          mermaidCode: fcResult.flowchart.mermaidCode,
          nodesJson: JSON.stringify({
            nodes: fcResult.flowchart.nodes,
            edges: fcResult.flowchart.edges,
          }),
          x: 80,
          y: 1020,
        },
      });
    }

    await recordAuditLog({
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "ai.generate_flowchart",
      targetType: "flowchart",
      targetId: savedFlowchart?.id || null,
      summary: `Generated AI Mermaid flowchart "${fcResult.flowchart.title}" via ${fcResult.providerUsed}`,
    });

    return NextResponse.json({
      flowchart: savedFlowchart || fcResult.flowchart,
      providerUsed: fcResult.providerUsed,
    });
  }

  let designSystemName: string | undefined;
  if (body.designSystemId) {
    const ds = await prisma.designSystem.findUnique({ where: { id: body.designSystemId } });
    if (ds) designSystemName = ds.name;
  }

  const generated = await provider.generateScreens({
    prompt,
    platform,
    fidelity,
    count,
    generationKind,
    designSystemName,
    baseScreenTitle: body.baseScreenTitle,
  });

  let pageId = body.pageId as string | undefined;
  let createdPage = null;

  if (!pageId) {
    createdPage = await prisma.designPage.create({
      data: {
        userId: actor.id,
        workstreamId: body.workstreamId || null,
        designSystemId: body.designSystemId || null,
        name: body.pageName || prompt.slice(0, 40),
        globalPrompt: prompt,
        platform,
        mode: fidelity,
      },
    });
    pageId = createdPage.id;
  }

  const existingCount = await prisma.wireframeScreen.count({ where: { pageId } });
  const stepX = platform === "desktop" ? 1080 : 440;

  const createdScreens = [];
  for (let i = 0; i < generated.screens.length; i += 1) {
    const s = generated.screens[i];
    const sc = await prisma.wireframeScreen.create({
      data: {
        pageId,
        groupId: body.groupId || null,
        name: s.name,
        screenPrompt: s.screenPrompt,
        fidelity: s.fidelity,
        platform: s.platform,
        htmlContent: s.htmlContent,
        reactCode: s.reactCode,
        x: 80 + (existingCount + i) * stepX,
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
    createdScreens.push(sc);
  }

  // If autoflow from a source screen, link sourceScreen -> first created screen
  if (generationKind === "autoflow" && body.sourceScreenId && createdScreens.length > 0) {
    await prisma.wireframeScreen.update({
      where: { id: body.sourceScreenId },
      data: { linkedNextScreenId: createdScreens[0].id },
    }).catch(() => {});
  }

  // Deduct 15 credits per screen
  await prisma.user.update({
    where: { id: actor.id },
    data: {
      creditsRemaining: Math.max(0, actor.creditsRemaining - createdScreens.length * 15),
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "ai.generate_screens",
    targetType: "design_page",
    targetId: pageId,
    summary: `Generated ${createdScreens.length} ${fidelity} ${platform} screen(s) (${generationKind}) via ${generated.providerUsed}`,
    metadata: {
      providerUsed: generated.providerUsed,
      modelName: generated.modelName,
      generationKind,
      count: createdScreens.length,
    },
  });

  return NextResponse.json({
    pageId,
    page: createdPage,
    screens: createdScreens,
    providerUsed: generated.providerUsed,
    modelName: generated.modelName,
  });
}
