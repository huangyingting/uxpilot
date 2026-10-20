import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const site = await prisma.publishedSite.findUnique({
      where: { slug },
      include: {
        page: {
          include: {
            screens: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
    if (!site || site.status.toLowerCase() !== "published") {
      return NextResponse.json({ error: "Published site not found or offline." }, { status: 404 });
    }
    await prisma.publishedSite.update({
      where: { id: site.id },
      data: { viewCount: site.viewCount + 1 },
    });
    const htmlSnapshot =
      site.page?.screens?.[0]?.htmlContent ||
      `<div style="padding:32px;font-family:sans-serif;background:#0f172a;color:#fff"><h1>${site.title}</h1></div>`;
    return NextResponse.json({
      site: {
        ...site,
        status: site.status.toLowerCase(),
        htmlSnapshot,
      },
    });
  }

  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const sites = await prisma.publishedSite.findMany({
    orderBy: { updatedAt: "desc" },
    include: { page: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    sites: sites.map((s) => ({
      ...s,
      status: s.status.toLowerCase(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to publish sites." }, { status: 403 });
  }

  const body = await req.json();
  const pageId = String(body.pageId || "");
  const page = await prisma.designPage.findUnique({
    where: { id: pageId },
    include: { screens: { orderBy: { createdAt: "asc" } } },
  });

  if (!page) {
    return NextResponse.json({ error: "Design page not found." }, { status: 404 });
  }

  const rawSlug =
    body.slug ||
    `${page.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

  const created = await prisma.publishedSite.create({
    data: {
      userId: actor.id,
      pageId: page.id,
      slug: rawSlug,
      title: body.title || `${page.name} — Live Preview`,
      status: "PUBLISHED",
      viewCount: 1,
    },
  });

  await prisma.designPage.update({
    where: { id: page.id },
    data: { isShared: true },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "site.publish",
    targetType: "published_site",
    targetId: created.id,
    summary: `Published design "${page.name}" at /s/${created.slug}`,
  });

  return NextResponse.json({ site: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required." }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id || "");
  const status = body.status === "unpublished" ? "unpublished" : "published";

  const updated = await prisma.publishedSite.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ site: updated });
}

export async function DELETE(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required." }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.publishedSite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
