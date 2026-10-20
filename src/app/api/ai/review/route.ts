import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const reviews = await prisma.designReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
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
  });
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
    return NextResponse.json({ error: "Editor role required to run AI UX review." }, { status: 403 });
  }

  const body = await req.json();
  let screenTitle = String(body.title || "Selected UI Screen");
  let htmlContent = String(body.htmlContent || "");

  if (body.screenId) {
    const screen = await prisma.wireframeScreen.findUnique({ where: { id: body.screenId } });
    if (screen) {
      screenTitle = screen.name;
      htmlContent = screen.htmlContent;
    }
  }

  const provider = getAIProvider(body.providerOverride);
  const { review, providerUsed } = await provider.evaluateScreenUx({
    screenTitle,
    htmlContent: htmlContent || "<div><h1>Sample Screen</h1><button>Continue</button></div>",
    reviewGoal: body.reviewGoal,
  });

  const saved = await prisma.designReview.create({
    data: {
      userId: actor.id,
      screenId: body.screenId || null,
      title: `${screenTitle} — UX & Eye-Tracking Review`,
      reviewGoal: body.reviewGoal || null,
      overallScore: review.overallScore,
      metricsJson: JSON.stringify(review.metrics),
      findingsJson: JSON.stringify(review.findings),
      heatmapPointsJson: JSON.stringify(review.heatmapPoints),
      scanpathJson: JSON.stringify(review.scanpath),
      gazeFlowJson: JSON.stringify(review.gazeFlow),
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "ai.ux_review",
    targetType: "design_review",
    targetId: saved.id,
    summary: `Executed AI UX Review & Predictive Eye-Tracking on "${screenTitle}" (Score: ${review.overallScore}/100) via ${providerUsed}`,
  });

  return NextResponse.json({
    review: {
      id: saved.id,
      screenId: saved.screenId,
      title: saved.title,
      reviewGoal: saved.reviewGoal,
      overallScore: saved.overallScore,
      metrics: review.metrics,
      findings: review.findings,
      heatmapPoints: review.heatmapPoints,
      scanpath: review.scanpath,
      gazeFlow: review.gazeFlow,
      createdAt: saved.createdAt.toISOString(),
    },
    providerUsed,
  });
}
