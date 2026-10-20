import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSessionActor } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json();
  const pageId = String(body.pageId || "").trim();
  const content = String(body.content || "").trim();

  if (!pageId || !content) {
    return NextResponse.json({ error: "pageId and content are required." }, { status: 400 });
  }

  const comment = await prisma.designComment.create({
    data: {
      pageId,
      screenId: body.screenId || null,
      authorId: actor.id,
      authorName: actor.name || actor.email,
      body: content,
      x: Number(body.x || 220),
      y: Number(body.y || 180),
      resolved: false,
      repliesJson: "[]",
    },
  });

  return NextResponse.json({
    comment: {
      ...comment,
      content: comment.body,
      replies: [],
    },
  }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json();
  const id = String(body.id || "");
  const existing = await prisma.designComment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const replies = JSON.parse(existing.repliesJson || "[]");
  if (body.replyText) {
    replies.push({
      id: `rep-${Date.now()}`,
      author: actor.name || actor.email,
      text: String(body.replyText).trim(),
      createdAt: new Date().toISOString(),
    });
  }

  const updated = await prisma.designComment.update({
    where: { id },
    data: {
      ...(body.resolved !== undefined ? { resolved: Boolean(body.resolved) } : {}),
      repliesJson: JSON.stringify(replies),
    },
  });

  return NextResponse.json({
    comment: {
      ...updated,
      replies,
    },
  });
}
