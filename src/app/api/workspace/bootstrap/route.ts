import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSessionActor } from "@/lib/api-auth";
import { getAIProviderStatus } from "@/lib/ai/provider";
import { seedInitialWorkspaceData } from "@/lib/bootstrap";

export async function GET(req: NextRequest) {
  let { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }

  // In non-production or when explicitly enabled, ensure initial workspace seed data exists
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_SEED !== "false") {
    const totalUsers = await prisma.user.count();
    if (totalUsers === 0) {
      await seedInitialWorkspaceData();
    }
  }

  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const [pages, workstreams, designSystems, publishedSites, mcpTokens, reviews, prRuns] =
    await Promise.all([
      prisma.designPage.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          workstream: { select: { id: true, name: true, color: true } },
          designSystem: { select: { id: true, name: true } },
          _count: { select: { screens: true, comments: true } },
        },
      }),
      prisma.workstream.findMany({
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { pages: true } } },
      }),
      prisma.designSystem.findMany({
        orderBy: { updatedAt: "desc" },
      }),
      prisma.publishedSite.findMany({
        orderBy: { updatedAt: "desc" },
        include: { page: { select: { id: true, name: true } } },
      }),
      prisma.mcpAccessToken.findMany({
        where: { userId: actor.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.designReview.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.prReviewRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  return NextResponse.json({
    user: actor,
    aiStatus: getAIProviderStatus(),
    pages: pages.map((p) => ({
      id: p.id,
      name: p.name,
      globalPrompt: p.globalPrompt,
      platform: p.platform,
      mode: p.mode,
      isBookmarked: p.isBookmarked,
      isShared: p.isShared,
      workstreamId: p.workstreamId,
      workstreamName: p.workstream?.name || null,
      designSystemId: p.designSystemId,
      designSystemName: p.designSystem?.name || null,
      screenCount: p._count.screens,
      commentCount: p._count.comments,
      updatedAt: p.updatedAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
    workstreams: workstreams.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      color: w.color,
      pageCount: w._count.pages,
      updatedAt: w.updatedAt.toISOString(),
    })),
    designSystems: designSystems.map((ds) => ({
      id: ds.id,
      name: ds.name,
      sourceType: ds.sourceType,
      sourceUrl: ds.sourceUrl,
      tokens: JSON.parse(ds.tokensJson || "{}"),
      components: JSON.parse(ds.componentsJson || "[]"),
      designMd: ds.designMd,
      isShared: ds.isShared,
      updatedAt: ds.updatedAt.toISOString(),
    })),
    publishedSites: publishedSites.map((s) => ({
      id: s.id,
      pageId: s.pageId,
      pageName: s.page?.name || s.title,
      slug: s.slug,
      title: s.title,
      status: s.status.toLowerCase(),
      viewCount: s.viewCount,
      updatedAt: s.updatedAt.toISOString(),
    })),
    mcpTokens: mcpTokens.map((t) => ({
      id: t.id,
      name: t.name,
      tokenPrefix: t.tokenPrefix,
      tokenValue: t.tokenValue,
      status: t.status,
      lastUsedAt: t.lastUsedAt?.toISOString() || null,
      createdAt: t.createdAt.toISOString(),
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      screenId: r.screenId,
      title: r.title,
      reviewGoal: r.reviewGoal,
      overallScore: r.overallScore,
      metrics: JSON.parse(r.metricsJson || "{}"),
      findings: JSON.parse(r.findingsJson || "[]"),
      heatmapPoints: JSON.parse(r.heatmapPointsJson || "[]"),
      scanpath: JSON.parse(r.scanpathJson || "[]"),
      gazeFlow: JSON.parse(r.gazeFlowJson || "[]"),
      createdAt: r.createdAt.toISOString(),
    })),
    prRuns: prRuns.map((pr) => ({
      id: pr.id,
      repoFullName: pr.repoFullName,
      prNumber: pr.prNumber,
      prTitle: pr.prTitle,
      branchName: pr.branchName,
      status: pr.status,
      score: pr.score,
      summary: pr.summary,
      findings: JSON.parse(pr.findingsJson || "[]"),
      createdAt: pr.createdAt.toISOString(),
    })),
  });
}
