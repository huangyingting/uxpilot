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

  const systems = await prisma.designSystem.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    designSystems: systems.map((ds) => ({
      ...ds,
      tokens: JSON.parse(ds.tokensJson || "{}"),
      components: JSON.parse(ds.componentsJson || "[]"),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to import or create design systems." }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || "Imported Design System").trim();
  const sourceType = String(body.sourceType || "manual");
  const sourceUrl = body.sourceUrl ? String(body.sourceUrl).trim() : null;

  const defaultTokens = body.tokens || {
    colors: {
      primary: body.primaryColor || "#6366f1",
      secondary: body.secondaryColor || "#8b5cf6",
      accent: body.accentColor || "#10b981",
      surface: "#0f172a",
      textPrimary: "#f8fafc",
    },
    typography: {
      headingFont: body.headingFont || "Plus Jakarta Sans",
      bodyFont: body.bodyFont || "Inter",
      monoFont: "JetBrains Mono",
      baseScale: "16px / 1.5",
    },
    radius: {
      sm: "8px",
      md: "12px",
      lg: "16px",
    },
  };

  const defaultComponents = body.components || [
    { name: "PrimaryButton", variants: ["solid", "outline", "ghost"], status: "ready" },
    { name: "MetricStatCard", variants: ["default", "compact", "sparkline"], status: "ready" },
    { name: "DataTablePro", variants: ["sortable", "selectable"], status: "ready" },
    { name: "NavigationDrawer", variants: ["expanded", "rail"], status: "ready" },
  ];

  const designMd =
    body.designMd ||
    `# ${name}\n\n- **Source**: ${sourceType}${sourceUrl ? ` (${sourceUrl})` : ""}\n- **Primary Color**: ${defaultTokens.colors.primary}\n- **Typography**: ${defaultTokens.typography.headingFont} / ${defaultTokens.typography.bodyFont}\n- **Radius**: ${defaultTokens.radius.md}\n`;

  const created = await prisma.designSystem.create({
    data: {
      userId: actor.id,
      name,
      sourceType,
      sourceUrl,
      tokensJson: JSON.stringify(defaultTokens),
      componentsJson: JSON.stringify(defaultComponents),
      designMd,
      isShared: true,
    },
  });

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "design_system.create",
    targetType: "design_system",
    targetId: created.id,
    summary: `Imported design system "${created.name}" via ${sourceType}`,
  });

  return NextResponse.json(
    {
      designSystem: {
        ...created,
        tokens: defaultTokens,
        components: defaultComponents,
      },
    },
    { status: 201 }
  );
}
