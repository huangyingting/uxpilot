import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { getAIProvider } from "@/lib/ai/provider";

async function ensureInitialUxDocuments(userId: string) {
  const count = await prisma.uxDocument.count();
  if (count > 0) return;

  await prisma.uxDocument.createMany({
    data: [
      {
        userId,
        title: "PRD: Institutional FinTech Multi-Currency Treasury Hub",
        docType: "PRD",
        status: "APPROVED",
        contentMd: `# PRD: Institutional FinTech Multi-Currency Treasury Hub\n\n## 1. Problem Statement\nFinance teams managing USD, EUR, and GBP accounts suffer from fragmented FX execution workflows and delayed approval visibility.\n\n## 2. Target Personas\n- **VP of Treasury**: Needs real-time liquidity telemetry and 1-click batch wire sign-off.\n- **Controller**: Requires immutable audit trails and role-based spend controls.\n\n## 3. Core Screen Requirements\n1. **Liquidity Command Center**: Consolidated net asset KPI cards, 30-day cashflow chart, and FX rate ticker.\n2. **Instant FX Conversion & Wire Drawer**: Real-time spread calculator with dual-approver RBAC badge.\n3. **Audit & Compliance Ledger**: Filterable log of every transfer and card limit update.`,
      },
      {
        userId,
        title: "UX Research & Accessibility Audit: Telehealth Triage Flow",
        docType: "UX_RESEARCH",
        status: "APPROVED",
        contentMd: `# UX Research Synthesis: Telehealth Patient Triage\n\n## Key Usability Findings\n- **Finding 1 (High Severity)**: Symptom severity sliders require 48×48px touch targets for older or tremors-affected patients.\n- **Finding 2 (Medium Severity)**: Display estimated clinician wait time prior to insurance card capture to reduce abandonment by 34%.`,
      },
    ],
  });
}

export async function GET(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await ensureInitialUxDocuments(actor.id);

  const documents = await prisma.uxDocument.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json(
      { error: "Editor role required to author UX documents." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const title = String(body.title || "AI Product Requirements Specification").trim();
  const docType = String(body.docType || "PRD").toUpperCase();
  const prompt = String(body.prompt || title).trim();

  const provider = getAIProvider();
  const enhanced = await provider.enhancePrompt({
    prompt,
    scope: "global",
    platform: "desktop",
    mode: "hifi",
  });

  const contentMd =
    body.contentMd ||
    `# ${title}\n\n- **Document Type**: \`${docType}\`\n- **Synthesized By**: \`${enhanced.providerUsed}\` (\`${enhanced.modelName}\`)\n\n## 1. Executive Summary & UX Objective\n${enhanced.enhancedPrompt}\n\n## 2. Information Architecture & Screen Inventory\n1. **Primary Workspace / Command View**: High-clarity KPI summary, contextual filters, and primary action toolbar.\n2. **Guided Task / Transaction Modal**: Progressive disclosure form with inline validation and keyboard shortcuts.\n3. **Empty, Loading & Error States**: Skeleton placeholders and actionable recovery banners.\n\n## 3. Accessibility & Design System Guardrails\n- Enforce WCAG 2.1 AA contrast ratios (\`>= 4.5:1\` normal text).\n- Bind all interactive controls to tokenized radii (\`12px\`) and focus rings.`;

  const created = await prisma.uxDocument.create({
    data: {
      userId: actor.id,
      title,
      docType,
      contentMd,
      status: "APPROVED",
    },
  });

  return NextResponse.json({ ok: true, document: created }, { status: 201 });
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
  if (!id) {
    return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  }

  const updated = await prisma.uxDocument.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
      ...(body.contentMd !== undefined ? { contentMd: String(body.contentMd) } : {}),
      ...(body.status !== undefined ? { status: String(body.status) } : {}),
    },
  });

  return NextResponse.json({ ok: true, document: updated });
}
