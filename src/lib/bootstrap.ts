import { prisma } from "./prisma";
import { hashPassword, normalizeEmail } from "./passwords";
import { recordAuditLog } from "./audit";
import { DeterministicDesignProvider } from "./ai/fallback-provider";

export async function bootstrapAdminAccount(input: {
  email: string;
  password: string;
  name?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const name = (input.name || "").trim() || "Alex Rivera";
  const passwordHash = hashPassword(input.password);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "Admin",
      status: "ACTIVE",
      revokedAt: null,
      revokedReason: null,
      planType: "enterprise",
      passwordCredential: {
        upsert: {
          create: { passwordHash },
          update: { passwordHash },
        },
      },
    },
    create: {
      email,
      name,
      role: "Admin",
      status: "ACTIVE",
      planType: "enterprise",
      creditsRemaining: 1500,
      creditsTotal: 1800,
      onboardingCompleted: true,
      passwordCredential: {
        create: { passwordHash },
      },
    },
  });

  await recordAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: "Admin",
    action: "bootstrap.admin",
    targetType: "user",
    targetId: user.id,
    summary: `CLI bootstrap ${existing ? "updated" : "created"} Admin account ${user.email}`,
  });

  return { user, created: !existing };
}

export async function seedInitialWorkspaceData() {
  const ai = new DeterministicDesignProvider();

  const { user: admin } = await bootstrapAdminAccount({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@uxpilot.local",
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD || "AdminPassword123!",
    name: process.env.BOOTSTRAP_ADMIN_NAME || "Alex Rivera",
  });

  // Create Editor & Viewer accounts for RBAC verification
  const editorEmail = "editor@uxpilot.local";
  await prisma.user.upsert({
    where: { email: editorEmail },
    update: { role: "Editor", status: "ACTIVE" },
    create: {
      email: editorEmail,
      name: "Maya Lin",
      role: "Editor",
      status: "ACTIVE",
      planType: "pro",
      creditsRemaining: 1200,
      creditsTotal: 1500,
      passwordCredential: {
        create: { passwordHash: hashPassword("EditorPassword123!") },
      },
    },
  });

  const viewerEmail = "viewer@uxpilot.local";
  await prisma.user.upsert({
    where: { email: viewerEmail },
    update: { role: "Viewer", status: "ACTIVE" },
    create: {
      email: viewerEmail,
      name: "Sam Patel",
      role: "Viewer",
      status: "ACTIVE",
      planType: "free",
      creditsRemaining: 300,
      creditsTotal: 300,
      passwordCredential: {
        create: { passwordHash: hashPassword("ViewerPassword123!") },
      },
    },
  });

  // Seed single-use, expiring, expired, and revoked invitations
  const futureDate = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const pastDate = new Date(Date.now() - 48 * 3600 * 1000);

  const sampleInvites = [
    {
      code: "UXP-2026-EDITOR1",
      email: null,
      assignedRole: "Editor",
      note: "Single-use Editor workspace invite",
      expiresAt: futureDate,
      revokedAt: null,
    },
    {
      code: "UXP-2026-VIEWER1",
      email: null,
      assignedRole: "Viewer",
      note: "Stakeholder read-only review invite",
      expiresAt: futureDate,
      revokedAt: null,
    },
    {
      code: "UXP-2026-LOCKED1",
      email: "locked.user@uxpilot.local",
      assignedRole: "Editor",
      note: "Email-bound invitation code",
      expiresAt: futureDate,
      revokedAt: null,
    },
    {
      code: "UXP-2026-EXPIRED",
      email: null,
      assignedRole: "Editor",
      note: "Expired single-use code for negative test",
      expiresAt: pastDate,
      revokedAt: null,
    },
    {
      code: "UXP-2026-REVOKED",
      email: null,
      assignedRole: "Editor",
      note: "Revoked invitation code for negative test",
      expiresAt: futureDate,
      revokedAt: new Date(),
    },
  ];

  for (const inv of sampleInvites) {
    await prisma.accountInvitation.upsert({
      where: { code: inv.code },
      update: {
        email: inv.email,
        assignedRole: inv.assignedRole,
        note: inv.note,
        expiresAt: inv.expiresAt,
        revokedAt: inv.revokedAt,
        createdByUserId: admin.id,
      },
      create: {
        code: inv.code,
        email: inv.email,
        assignedRole: inv.assignedRole,
        note: inv.note,
        expiresAt: inv.expiresAt,
        revokedAt: inv.revokedAt,
        createdByUserId: admin.id,
      },
    });
  }

  // Check if workspace pages already exist
  const existingPages = await prisma.designPage.count({ where: { userId: admin.id } });
  if (existingPages === 0) {
    const ws1 = await prisma.workstream.create({
      data: {
        userId: admin.id,
        name: "Q2 Product Design",
        description: "Core mobile banking and SaaS analytics user flows",
        color: "#7c3aed",
      },
    });

    const ws2 = await prisma.workstream.create({
      data: {
        userId: admin.id,
        name: "Design System Components",
        description: "Tokenized React & Tailwind component libraries",
        color: "#10b981",
      },
    });

    const dsExtracted = await ai.extractDesignSystem({
      name: "Polaris FinTech UI",
      sourceType: "react",
      sourceUrl: "https://github.com/acme/polaris-fintech-ui",
      accentColor: "#7c3aed",
    });

    const ds1 = await prisma.designSystem.create({
      data: {
        userId: admin.id,
        name: dsExtracted.system.name,
        sourceType: "react",
        sourceUrl: "https://github.com/acme/polaris-fintech-ui",
        tokensJson: JSON.stringify(dsExtracted.system.tokens),
        componentsJson: JSON.stringify(dsExtracted.system.components),
        designMd: dsExtracted.system.designMd,
        isShared: true,
      },
    });

    const generatedFintech = await ai.generateScreens({
      prompt: "Modern NeoBank mobile app with total balance yield, instant FX transfer, and spending analytics",
      platform: "mobile",
      fidelity: "hifi",
      count: 3,
      designSystemName: ds1.name,
      baseScreenTitle: "Fintech Mobile Banking",
    });

    const page1 = await prisma.designPage.create({
      data: {
        userId: admin.id,
        workstreamId: ws1.id,
        designSystemId: ds1.id,
        name: "Fintech Mobile Banking",
        globalPrompt: "Modern NeoBank mobile app with high-contrast dark mode, APY yield cards, and instant transfers",
        platform: "mobile",
        mode: "hifi",
        isBookmarked: true,
        isShared: true,
        sharedWithEmails: JSON.stringify(["editor@uxpilot.local", "viewer@uxpilot.local"]),
      },
    });

    const grp1 = await prisma.screenGroup.create({
      data: {
        pageId: page1.id,
        name: "Core Banking & Yield Flow",
        sectionPrompt: "Onboarding, account balance overview, and instant peer-to-peer FX transfer",
        orderIndex: 0,
      },
    });

    const createdScreenIds: string[] = [];
    for (let i = 0; i < generatedFintech.screens.length; i += 1) {
      const s = generatedFintech.screens[i];
      const sc = await prisma.wireframeScreen.create({
        data: {
          pageId: page1.id,
          groupId: grp1.id,
          name: s.name,
          screenPrompt: s.screenPrompt,
          fidelity: s.fidelity,
          platform: s.platform,
          htmlContent: s.htmlContent,
          reactCode: s.reactCode,
          x: 80 + i * 440,
          y: 110,
          width: s.width,
          height: s.height,
          versionHistoryJson: JSON.stringify([
            {
              version: 1,
              savedAt: new Date().toISOString(),
              name: `${s.name} (Initial Generation)`,
              htmlContent: s.htmlContent,
            },
          ]),
        },
      });
      createdScreenIds.push(sc.id);
    }

    if (createdScreenIds.length >= 2) {
      await prisma.wireframeScreen.update({
        where: { id: createdScreenIds[0] },
        data: { linkedNextScreenId: createdScreenIds[1] },
      });
    }

    const fc = await ai.generateFlowchart({
      prompt: "Fintech mobile onboarding, KYC check, and instant transfer userflow",
      pageTitle: "Fintech Mobile Banking",
    });

    await prisma.canvasFlowchart.create({
      data: {
        pageId: page1.id,
        title: fc.flowchart.title,
        prompt: "Fintech mobile onboarding, KYC check, and instant transfer userflow",
        mermaidCode: fc.flowchart.mermaidCode,
        nodesJson: JSON.stringify({ nodes: fc.flowchart.nodes, edges: fc.flowchart.edges }),
        x: 80,
        y: 1010,
      },
    });

    await prisma.designComment.create({
      data: {
        pageId: page1.id,
        screenId: createdScreenIds[0],
        authorId: admin.id,
        authorName: admin.name,
        body: "Love the 4.8% APY emerald badge contrast here — ready for engineering handoff.",
        x: 240,
        y: 180,
        resolved: false,
        repliesJson: JSON.stringify([
          {
            id: "rep-1",
            authorName: "Maya Lin",
            body: "Exported the React TSX snippet and matched Polaris tokens!",
            createdAt: new Date().toISOString(),
          },
        ]),
      },
    });

    // Second page: SaaS Analytics Workspace (Desktop)
    const generatedSaas = await ai.generateScreens({
      prompt: "Enterprise SaaS AI telemetry dashboard with real-time token usage, cohort retention, and alert rules",
      platform: "desktop",
      fidelity: "hifi",
      count: 2,
      designSystemName: ds1.name,
      baseScreenTitle: "SaaS Analytics Workspace",
    });

    const page2 = await prisma.designPage.create({
      data: {
        userId: admin.id,
        workstreamId: ws1.id,
        designSystemId: ds1.id,
        name: "SaaS Analytics Workspace",
        globalPrompt: "Enterprise SaaS AI telemetry dashboard with real-time token usage and retention cohorts",
        platform: "desktop",
        mode: "hifi",
        isBookmarked: false,
        isShared: true,
        sharedWithEmails: JSON.stringify(["viewer@uxpilot.local"]),
      },
    });

    const grp2 = await prisma.screenGroup.create({
      data: {
        pageId: page2.id,
        name: "Executive Analytics Flow",
        sectionPrompt: "KPI command center and drill-down logs",
        orderIndex: 0,
      },
    });

    for (let i = 0; i < generatedSaas.screens.length; i += 1) {
      const s = generatedSaas.screens[i];
      await prisma.wireframeScreen.create({
        data: {
          pageId: page2.id,
          groupId: grp2.id,
          name: s.name,
          screenPrompt: s.screenPrompt,
          fidelity: s.fidelity,
          platform: s.platform,
          htmlContent: s.htmlContent,
          reactCode: s.reactCode,
          x: 80 + i * 1080,
          y: 110,
          width: s.width,
          height: s.height,
        },
      });
    }

    // Third page: Wireframe E-Commerce Checkout in Folder 2
    const generatedWireframe = await ai.generateScreens({
      prompt: "Low-fidelity wireframe checkout flow with cart summary, express pay, and order confirmation",
      platform: "mobile",
      fidelity: "wireframe",
      count: 2,
      baseScreenTitle: "Express Checkout Wireframes",
    });

    const page3 = await prisma.designPage.create({
      data: {
        userId: admin.id,
        workstreamId: ws2.id,
        name: "Express Checkout Wireframes",
        globalPrompt: "Low-fidelity wireframe checkout flow",
        platform: "mobile",
        mode: "wireframe",
        isBookmarked: true,
        isShared: false,
      },
    });

    for (let i = 0; i < generatedWireframe.screens.length; i += 1) {
      const s = generatedWireframe.screens[i];
      await prisma.wireframeScreen.create({
        data: {
          pageId: page3.id,
          name: s.name,
          screenPrompt: s.screenPrompt,
          fidelity: "wireframe",
          platform: "mobile",
          htmlContent: s.htmlContent,
          reactCode: s.reactCode,
          x: 80 + i * 440,
          y: 110,
          width: s.width,
          height: s.height,
        },
      });
    }

    // Seed initial UX Design Review with Heatmap, Scanpath & Gaze Flow
    const uxEval = await ai.evaluateScreenUx({
      screenTitle: generatedFintech.screens[0].name,
      htmlContent: generatedFintech.screens[0].htmlContent,
      reviewGoal: "Maximize mobile conversion clarity and WCAG 2.1 AA contrast compliance",
    });

    await prisma.designReview.create({
      data: {
        userId: admin.id,
        screenId: createdScreenIds[0],
        title: "Fintech Mobile Banking — Heuristic & Eye-Tracking Audit",
        reviewGoal: "Maximize mobile conversion clarity and WCAG 2.1 AA contrast compliance",
        overallScore: uxEval.review.overallScore,
        metricsJson: JSON.stringify(uxEval.review.metrics),
        findingsJson: JSON.stringify(uxEval.review.findings),
        heatmapPointsJson: JSON.stringify(uxEval.review.heatmapPoints),
        scanpathJson: JSON.stringify(uxEval.review.scanpath),
        gazeFlowJson: JSON.stringify(uxEval.review.gazeFlow),
      },
    });

    // Seed GitHub PR Review Run
    const prAudit = await ai.auditPullRequest({
      repoFullName: "acme/fintech-mobile-web",
      prNumber: 142,
      prTitle: "feat(checkout): redesign instant FX transfer & yield cards",
      branchName: "feat/fx-transfer-v2",
      designSystemName: ds1.name,
    });

    await prisma.prReviewRun.create({
      data: {
        userId: admin.id,
        repoFullName: "acme/fintech-mobile-web",
        prNumber: 142,
        prTitle: "feat(checkout): redesign instant FX transfer & yield cards",
        branchName: "feat/fx-transfer-v2",
        designSystemId: ds1.id,
        status: prAudit.audit.status,
        score: prAudit.audit.score,
        summary: prAudit.audit.summary,
        findingsJson: JSON.stringify(prAudit.audit.findings),
      },
    });

    // Seed Published Site
    await prisma.publishedSite.upsert({
      where: { slug: "fintech-mobile-demo" },
      update: {},
      create: {
        userId: admin.id,
        pageId: page1.id,
        slug: "fintech-mobile-demo",
        title: "Fintech Mobile Banking — Live Interactive Prototype",
        status: "PUBLISHED",
        viewCount: 128,
      },
    });

    // Seed Personal MCP Access Token
    await prisma.mcpAccessToken.upsert({
      where: { tokenValue: "uxp_mcp_live_98a1f4c2e9b011d3a7f5" },
      update: {},
      create: {
        userId: admin.id,
        name: "Cursor & Claude Code MCP",
        tokenPrefix: "uxp_mcp_live_98a1...",
        tokenValue: "uxp_mcp_live_98a1f4c2e9b011d3a7f5",
        status: "ACTIVE",
        lastUsedAt: new Date(),
      },
    });
  }

  return { adminEmail: admin.email };
}
