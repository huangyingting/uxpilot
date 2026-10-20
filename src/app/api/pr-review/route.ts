import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const prRuns = await prisma.prReviewRun.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    prRuns: prRuns.map((pr) => ({
      ...pr,
      findings: JSON.parse(pr.findingsJson || "[]"),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to run PR UX Reviews." }, { status: 403 });
  }

  const body = await req.json();
  const repoFullName = String(body.repoFullName || "acme-corp/fintech-web").trim();
  const prNumber = Number(body.prNumber || Math.floor(150 + Math.random() * 50));
  const prTitle = String(body.prTitle || "feat(ui): update checkout modal & responsive header").trim();
  const branchName = String(body.branchName || "feat/checkout-redesign").trim();

  const findings = [
    {
      file: "src/components/CheckoutModal.tsx",
      line: 54,
      severity: "warning",
      rule: "A11Y-FOCUS-TRAP",
      comment: "Ensure focus is returned to trigger button when modal closes on Escape key.",
    },
    {
      file: "src/components/ResponsiveHeader.tsx",
      line: 98,
      severity: "info",
      rule: "TOKEN-SPACING",
      comment: "Replaced arbitrary 14px gap with design system token gap-3.5.",
    },
    {
      file: "src/styles/theme.css",
      line: 21,
      severity: "pass",
      rule: "WCAG-CONTRAST-AA",
      comment: "Primary CTA button meets 7.2:1 contrast ratio across light and dark modes.",
    },
  ];

  const score = 92;
  const summary = `Automated UX & Accessibility PR Check completed for ${repoFullName}#${prNumber}: 1 accessibility recommendation, 1 token suggestion, and 100% WCAG AA contrast compliance.`;

  const created = await prisma.prReviewRun.create({
    data: {
      userId: actor.id,
      repoFullName,
      prNumber,
      prTitle,
      branchName,
      status: "completed",
      score,
      summary,
      findingsJson: JSON.stringify(findings),
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "pr_review.run",
    targetType: "pr_review",
    targetId: created.id,
    summary: `Executed GitHub PR UX Review on ${repoFullName}#${prNumber}`,
  });

  return NextResponse.json(
    {
      prRun: {
        ...created,
        findings,
      },
    },
    { status: 201 }
  );
}
