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
    return NextResponse.json({ error: "Editor role required to send Labs assets to canvas." }, { status: 403 });
  }

  const body = await req.json();
  const title = String(body.title || "Labs Shader Hero Screen").trim();
  const cssBackground = String(
    body.cssBackground || "radial-gradient(circle at 20% 20%, #6366f1, #a855f7 50%, #0f172a 100%)"
  );
  const shaderCode = String(body.shaderCode || "");

  let targetPage = await prisma.designPage.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!targetPage) {
    targetPage = await prisma.designPage.create({
      data: {
        userId: actor.id,
        name: "UX Pilot Labs Showcase",
        globalPrompt: title,
        platform: "desktop",
        mode: "hifi",
      },
    });
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
  body {
    min-height: 100vh;
    background: ${cssBackground};
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 12px;
    font-weight: 600;
    width: fit-content;
  }
  .hero {
    max-width: 620px;
    margin: auto 0;
  }
  h1 {
    font-size: 46px;
    line-height: 1.08;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
    text-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  }
  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.86);
    line-height: 1.6;
    margin-bottom: 24px;
  }
  .cta {
    display: inline-flex;
    padding: 12px 24px;
    border-radius: 12px;
    background: #ffffff;
    color: #0f172a;
    font-weight: 700;
    font-size: 14px;
  }
</style>
</head>
<body>
  <div class="badge">UX Pilot Labs • Exported Shader Asset</div>
  <div class="hero">
    <h1>${title}</h1>
    <p>Generated interactively in UX Pilot Labs and injected directly onto your infinite UI design canvas.</p>
    <div class="cta">Launch Interactive Experience →</div>
  </div>
</body>
</html>`;

  const screen = await prisma.wireframeScreen.create({
    data: {
      pageId: targetPage.id,
      name: title,
      screenPrompt: `Labs export: ${title}`,
      fidelity: "hifi",
      platform: "desktop",
      htmlContent,
      reactCode: shaderCode || `export function LabsHero() {\n  return <div style={{ background: "${cssBackground}" }}>${title}</div>;\n}`,
      x: 120,
      y: 560,
      width: 1024,
      height: 680,
      versionHistoryJson: JSON.stringify([
        {
          version: 1,
          savedAt: new Date().toISOString(),
          name: `${title} (v1)`,
          htmlContent,
        },
      ]),
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "labs.send_to_canvas",
    targetType: "wireframe_screen",
    targetId: screen.id,
    summary: `Sent Labs shader "${title}" to canvas page "${targetPage.name}"`,
  });

  return NextResponse.json({
    pageId: targetPage.id,
    screenId: screen.id,
  });
}
