import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { buildScreenHtmlAndReact } from "@/lib/ai/fallback-provider";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to modify screens." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const existing = await prisma.wireframeScreen.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Screen not found." }, { status: 404 });
  }

  const history = (() => {
    try {
      return JSON.parse(existing.versionHistoryJson || "[]");
    } catch {
      return [];
    }
  })();

  let nextHtml = body.htmlContent ?? existing.htmlContent;
  let nextReact = body.reactCode ?? existing.reactCode;
  const nextName = body.name ? String(body.name).trim() : existing.name;
  const nextFidelity = body.fidelity || existing.fidelity;
  const nextPrompt = body.screenPrompt ?? existing.screenPrompt ?? "";

  if (body.regenerateFromPrompt) {
    const built = buildScreenHtmlAndReact({
      title: nextName,
      prompt: nextPrompt,
      fidelity: nextFidelity === "wireframe" ? "wireframe" : "hifi",
      platform: existing.platform === "desktop" ? "desktop" : "mobile",
      paletteIndex: history.length + 1,
    });
    nextHtml = built.htmlContent;
    nextReact = built.reactCode;
  }

  if (body.restoreVersion) {
    const targetVer = history.find((v: { version: number }) => v.version === Number(body.restoreVersion));
    if (targetVer?.htmlContent) {
      nextHtml = targetVer.htmlContent;
    }
  } else {
    history.push({
      version: history.length + 1,
      savedAt: new Date().toISOString(),
      name: `${nextName} (v${history.length + 1})`,
      htmlContent: nextHtml,
    });
  }

  const updated = await prisma.wireframeScreen.update({
    where: { id },
    data: {
      name: nextName,
      screenPrompt: nextPrompt,
      fidelity: nextFidelity,
      htmlContent: nextHtml,
      reactCode: nextReact,
      ...(body.x !== undefined ? { x: Number(body.x) } : {}),
      ...(body.y !== undefined ? { y: Number(body.y) } : {}),
      versionHistoryJson: JSON.stringify(history.slice(-10)),
    },
  });

  return NextResponse.json({
    screen: {
      ...updated,
      versionHistory: JSON.parse(updated.versionHistoryJson || "[]"),
    },
  });
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
    return NextResponse.json({ error: "Editor role required to delete screens." }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.wireframeScreen.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
