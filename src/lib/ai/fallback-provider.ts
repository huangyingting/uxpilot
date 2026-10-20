import type {
  AIProvider,
  AuditPrInput,
  EnhancePromptInput,
  EnhancePromptOutput,
  EvaluateUxInput,
  ExtractDesignSystemInput,
  ExtractedDesignSystemPayload,
  GenerateFlowchartInput,
  GenerateScreensInput,
  GeneratedFlowchartPayload,
  GeneratedScreenPayload,
  PrAuditPayload,
  UxReviewPayload,
} from "./types";

const VARIATION_PALETTES = [
  {
    badge: "Look 1 · Obsidian Violet",
    bg: "#090a10",
    surface: "#121524",
    border: "#262b44",
    accent: "#7c3aed",
    accentSoft: "rgba(124,58,237,0.18)",
    text: "#f8fafc",
    muted: "#94a3b8",
  },
  {
    badge: "Look 2 · Emerald FinTech",
    bg: "#06110e",
    surface: "#0d1f1a",
    border: "#1b3b32",
    accent: "#10b981",
    accentSoft: "rgba(16,185,129,0.18)",
    text: "#ecfdf5",
    muted: "#a7f3d0",
  },
  {
    badge: "Look 3 · Daylight Editorial",
    bg: "#f8fafc",
    surface: "#ffffff",
    border: "#e2e8f0",
    accent: "#2563eb",
    accentSoft: "rgba(37,99,235,0.12)",
    text: "#0f172a",
    muted: "#475569",
  },
  {
    badge: "Look 4 · Cyber Amber",
    bg: "#110d06",
    surface: "#1f170b",
    border: "#3d2e16",
    accent: "#f59e0b",
    accentSoft: "rgba(245,158,11,0.18)",
    text: "#fffbeb",
    muted: "#fcd34d",
  },
];

export function buildScreenHtmlAndReact(opts: {
  title: string;
  prompt: string;
  fidelity: "hifi" | "wireframe";
  platform: "mobile" | "desktop";
  paletteIndex: number;
  designSystemName?: string;
}): { htmlContent: string; reactCode: string } {
  const palette = VARIATION_PALETTES[opts.paletteIndex % VARIATION_PALETTES.length];
  const isWireframe = opts.fidelity === "wireframe";
  const bg = isWireframe ? "#f8fafc" : palette.bg;
  const surface = isWireframe ? "#ffffff" : palette.surface;
  const border = isWireframe ? "#cbd5e1" : palette.border;
  const accent = isWireframe ? "#334155" : palette.accent;
  const text = isWireframe ? "#0f172a" : palette.text;
  const muted = isWireframe ? "#64748b" : palette.muted;
  const dsLabel = opts.designSystemName || (isWireframe ? "Low-Fi Wireframe Kit" : palette.badge);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${bg};
      color: ${text};
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 20px;
      min-height: 100vh;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 1px solid ${border};
      margin-bottom: 18px;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 999px;
      background: ${isWireframe ? "#e2e8f0" : palette.accentSoft};
      color: ${accent};
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      margin-top: 6px;
    }
    .cta {
      background: ${accent};
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 9px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(${opts.platform === "desktop" ? 3 : 2}, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }
    .card {
      background: ${surface};
      border: 1px ${isWireframe ? "dashed" : "solid"} ${border};
      border-radius: 14px;
      padding: 14px;
    }
    .label {
      font-size: 11px;
      color: ${muted};
      margin-bottom: 4px;
    }
    .value {
      font-size: 18px;
      font-weight: 700;
    }
    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 0;
      border-bottom: 1px solid ${border};
      font-size: 13px;
    }
    .list-item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <header class="header">
    <div>
      <span class="badge">${dsLabel}</span>
      <h1 class="title">${opts.title}</h1>
    </div>
    <button class="cta">Primary Action</button>
  </header>
  <section class="kpi-grid">
    <div class="card">
      <div class="label">Active Conversion</div>
      <div class="value">94.8%</div>
    </div>
    <div class="card">
      <div class="label">Engagement Velocity</div>
      <div class="value">+28.4%</div>
    </div>
    ${
      opts.platform === "desktop"
        ? `<div class="card"><div class="label">SLA Health</div><div class="value">99.98%</div></div>`
        : ""
    }
  </section>
  <section class="card" style="margin-bottom: 14px;">
    <div class="label">AI Prompt Specification</div>
    <p style="font-size: 12px; line-height: 1.5; margin-top: 4px;">${opts.prompt}</p>
  </section>
  <section class="card">
    <div class="label" style="margin-bottom: 8px;">Interactive Workflow Modules</div>
    <div class="list-item">
      <span>1. Onboarding & Identity Verification</span>
      <span style="color:${accent};font-weight:600;">Ready →</span>
    </div>
    <div class="list-item">
      <span>2. Real-time Telemetry & Smart Alerts</span>
      <span style="color:${accent};font-weight:600;">Active →</span>
    </div>
    <div class="list-item">
      <span>3. One-Click Checkout & Confirmation</span>
      <span style="color:${accent};font-weight:600;">Verified →</span>
    </div>
  </section>
</body>
</html>`;

  const componentName =
    opts.title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("") || "GeneratedScreen";

  const reactCode = `import React from "react";

export function ${componentName}() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "${bg}", color: "${text}" }}>
      <header className="flex items-center justify-between pb-4 mb-6 border-b" style={{ borderColor: "${border}" }}>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full" style={{ color: "${accent}" }}>
            ${dsLabel}
          </span>
          <h1 className="text-xl font-bold mt-1.5">${opts.title}</h1>
        </div>
        <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "${accent}" }}>
          Primary Action
        </button>
      </header>
      <section className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-4 rounded-xl border" style={{ backgroundColor: "${surface}", borderColor: "${border}" }}>
          <div className="text-xs opacity-70">Active Conversion</div>
          <div className="text-lg font-bold mt-1">94.8%</div>
        </div>
        <div className="p-4 rounded-xl border" style={{ backgroundColor: "${surface}", borderColor: "${border}" }}>
          <div className="text-xs opacity-70">Engagement Velocity</div>
          <div className="text-lg font-bold mt-1">+28.4%</div>
        </div>
      </section>
      <section className="p-4 rounded-xl border" style={{ backgroundColor: "${surface}", borderColor: "${border}" }}>
        <p className="text-xs leading-relaxed">${opts.prompt.replace(/"/g, '\\"')}</p>
      </section>
    </div>
  );
}
`;

  return { htmlContent, reactCode };
}

export class DeterministicDesignProvider implements AIProvider {
  readonly id = "deterministic" as const;
  readonly modelName = "uxpilot-deterministic-v2";

  async enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
    const scopeLabel =
      input.scope === "global"
        ? "Global Product Architecture"
        : input.scope === "section"
        ? "Multi-Screen Section Flow"
        : "Screen-Level UI Specification";
    const platformLabel = input.platform === "desktop" ? "Desktop (1440×900)" : "Mobile (390×844)";
    const enhancedPrompt = `${input.prompt.trim()} — [${scopeLabel} · ${platformLabel}]: Include clear visual hierarchy with primary KPI summary cards, WCAG AA contrast tokens, interactive status badges, progressive disclosure navigation, and frictionless primary CTA placement.`;
    return {
      enhancedPrompt,
      providerUsed: this.id,
      modelName: this.modelName,
    };
  }

  async generateScreens(input: GenerateScreensInput): Promise<{
    screens: GeneratedScreenPayload[];
    providerUsed: "deterministic";
    modelName: string;
  }> {
    const count = Math.max(1, Math.min(4, input.count || (input.generationKind === "variations" ? 4 : 2)));
    const width = input.platform === "desktop" ? 1024 : 390;
    const height = input.platform === "desktop" ? 720 : 844;
    const baseName =
      input.baseScreenTitle ||
      input.prompt
        .split(/[.,;:\n]/)[0]
        .trim()
        .slice(0, 38) ||
      "Product Experience";

    const stageSuffixes =
      input.generationKind === "variations"
        ? ["Look A · Obsidian", "Look B · Emerald", "Look C · Daylight", "Look D · Cyber Amber"]
        : input.generationKind === "autoflow"
        ? ["Step 2 · Interactive Configuration", "Step 3 · Review & Confirmation"]
        : ["Overview & KPI Dashboard", "Interactive Detail & Action", "Settings & Preferences", "Analytics & Insights"];

    const screens: GeneratedScreenPayload[] = [];
    for (let i = 0; i < count; i += 1) {
      const title = `${baseName} — ${stageSuffixes[i % stageSuffixes.length]}`;
      const { htmlContent, reactCode } = buildScreenHtmlAndReact({
        title,
        prompt: input.prompt,
        fidelity: input.fidelity,
        platform: input.platform,
        paletteIndex: i,
        designSystemName: input.designSystemName,
      });
      screens.push({
        name: title,
        screenPrompt: input.prompt,
        fidelity: input.fidelity,
        platform: input.platform,
        htmlContent,
        reactCode,
        width,
        height,
      });
    }

    return {
      screens,
      providerUsed: this.id,
      modelName: this.modelName,
    };
  }

  async generateFlowchart(input: GenerateFlowchartInput): Promise<{
    flowchart: GeneratedFlowchartPayload;
    providerUsed: "deterministic";
  }> {
    const title = input.pageTitle ? `${input.pageTitle} Userflow` : "AI Generated Userflow";
    const mermaidCode = `flowchart LR
  A([Entry: Landing / Auth]) --> B[Onboarding & Role Check]
  B --> C{Invite Valid?}
  C -->|Yes| D[Main Workspace Dashboard]
  C -->|No| E[Request Admin Invite]
  D --> F[Infinite Canvas Studio]
  F --> G([Export React / Figma / Live Site])`;

    return {
      flowchart: {
        title,
        mermaidCode,
        nodes: [
          { id: "n1", label: "Entry: Sign In / Invite Check", kind: "start", x: 40, y: 80 },
          { id: "n2", label: "Workspace Dashboard", kind: "screen", x: 260, y: 80 },
          { id: "n3", label: "AI Generation Mode?", kind: "decision", x: 480, y: 80 },
          { id: "n4", label: "Infinite Canvas & 4-Look", kind: "action", x: 700, y: 40 },
          { id: "n5", label: "UX Review & Eye-Tracking", kind: "action", x: 700, y: 130 },
          { id: "n6", label: "Export Code / Publish Site", kind: "end", x: 940, y: 80 },
        ],
        edges: [
          { from: "n1", to: "n2", label: "Verified" },
          { from: "n2", to: "n3", label: "Prompt" },
          { from: "n3", to: "n4", label: "Hi-Fi / Wireframe" },
          { from: "n3", to: "n5", label: "Audit" },
          { from: "n4", to: "n6", label: "Ship" },
          { from: "n5", to: "n6", label: "Approved" },
        ],
      },
      providerUsed: this.id,
    };
  }

  async evaluateScreenUx(input: EvaluateUxInput): Promise<{
    review: UxReviewPayload;
    providerUsed: "deterministic";
  }> {
    const hasButton = /<button/i.test(input.htmlContent);
    const hasHeading = /<h1|<h2/i.test(input.htmlContent);
    const baseScore = (hasButton ? 45 : 35) + (hasHeading ? 45 : 38);
    const overallScore = Math.min(96, Math.max(78, baseScore + 4));

    return {
      review: {
        overallScore,
        metrics: {
          visualHierarchy: overallScore + 2,
          accessibility: overallScore - 3,
          usability: overallScore + 1,
          copyClarity: overallScore,
          conversion: overallScore - 1,
        },
        findings: [
          {
            id: "f-1",
            category: "Visual Hierarchy",
            severity: "pass",
            title: "Strong primary header & KPI card focal anchoring",
            description: `Top-left brand badge and primary heading on "${input.screenTitle}" capture 42% of initial 3-second fixation.`,
            recommendation: "Maintain current typographic contrast ratio between primary KPI values and supporting labels.",
          },
          {
            id: "f-2",
            category: "Conversion & CTA",
            severity: "warning",
            title: "Secondary action proximity can dilute primary CTA",
            description: input.reviewGoal
              ? `Evaluated against goal "${input.reviewGoal}": interactive list items compete slightly with the top-right CTA.`
              : "Multiple interactive rows draw saccades away from the top-right primary action.",
            recommendation: "Add a sticky bottom confirmation bar or increase primary button padding by 4px on mobile viewports.",
          },
          {
            id: "f-3",
            category: "WCAG 2.1 AA Accessibility",
            severity: "critical",
            title: "Verify muted caption contrast on translucent surfaces",
            description: "11px uppercase badges require at least 4.5:1 contrast ratio against dark card backgrounds.",
            recommendation: "Use #cbd5e1 or brighter for secondary metadata labels on dark surfaces.",
          },
        ],
        heatmapPoints: [
          { id: "hp-1", x: 26, y: 14, intensity: 0.95, radius: 72, label: "Primary Title & Brand Header" },
          { id: "hp-2", x: 82, y: 14, intensity: 0.88, radius: 64, label: "Primary Action CTA" },
          { id: "hp-3", x: 28, y: 34, intensity: 0.82, radius: 68, label: "Primary KPI Metric (94.8%)" },
          { id: "hp-4", x: 74, y: 34, intensity: 0.68, radius: 56, label: "Secondary Velocity Card" },
          { id: "hp-5", x: 45, y: 74, intensity: 0.61, radius: 60, label: "Interactive Workflow List" },
        ],
        scanpath: [
          { step: 1, x: 26, y: 14, dwellMs: 380, label: "Header Title" },
          { step: 2, x: 28, y: 34, dwellMs: 310, label: "Primary KPI Card" },
          { step: 3, x: 82, y: 14, dwellMs: 290, label: "Primary CTA Button" },
          { step: 4, x: 74, y: 34, dwellMs: 220, label: "Secondary KPI" },
          { step: 5, x: 45, y: 74, dwellMs: 260, label: "Workflow Module List" },
        ],
        gazeFlow: [
          { zone: "Header & Primary CTA", percentage: 41, verdict: "Optimal initial capture" },
          { zone: "KPI Summary Grid", percentage: 34, verdict: "High scannability" },
          { zone: "Workflow Action Rows", percentage: 25, verdict: "Balanced secondary engagement" },
        ],
      },
      providerUsed: this.id,
    };
  }

  async extractDesignSystem(input: ExtractDesignSystemInput): Promise<{
    system: ExtractedDesignSystemPayload;
    providerUsed: "deterministic";
  }> {
    const primary = input.accentColor || "#7c3aed";
    return {
      system: {
        name: input.name,
        sourceType: input.sourceType,
        tokens: {
          colors: {
            primary,
            primaryHover: "#6d28d9",
            background: "#090a10",
            surface: "#121524",
            border: "#262b44",
            textPrimary: "#f8fafc",
            textMuted: "#94a3b8",
            success: "#10b981",
            warning: "#f59e0b",
            danger: "#ef4444",
          },
          typography: {
            headingFont: "Inter, sans-serif",
            bodyFont: "Inter, sans-serif",
            monoFont: "JetBrains Mono, monospace",
            scale: ["12px", "14px", "16px", "20px", "24px", "32px"],
          },
          radii: {
            sm: "8px",
            md: "12px",
            lg: "16px",
            pill: "9999px",
          },
          spacing: ["4px", "8px", "12px", "16px", "24px", "32px"],
        },
        components: [
          {
            id: "cmp-button",
            name: "PrimaryButton",
            category: "Actions",
            description: "Tokenized high-contrast action button with focus ring and loading state.",
            previewHtml: `<button style="background:${primary};color:#fff;padding:10px 18px;border-radius:12px;border:none;font-weight:600;">Continue Flow →</button>`,
            reactSnippet: `<Button variant="primary" size="md">Continue Flow</Button>`,
          },
          {
            id: "cmp-metric-card",
            name: "KpiMetricCard",
            category: "Data Display",
            description: "Surface card with trend delta badge and sparkline slot.",
            previewHtml: `<div style="background:#121524;border:1px solid #262b44;padding:14px;border-radius:14px;color:#f8fafc;"><div style="font-size:11px;color:#94a3b8">Net Retention</div><div style="font-size:20px;font-weight:700;margin-top:4px;">118.4%</div></div>`,
            reactSnippet: `<KpiMetricCard label="Net Retention" value="118.4%" delta="+4.2%" />`,
          },
          {
            id: "cmp-input",
            name: "PromptInputField",
            category: "Forms",
            description: "Accessible input control with prefix icon and keyboard shortcut hint.",
            previewHtml: `<input placeholder="Describe your UI flow..." style="background:#090a10;border:1px solid #262b44;color:#f8fafc;padding:10px 14px;border-radius:10px;width:100%;" />`,
            reactSnippet: `<PromptInputField placeholder="Describe your UI flow..." shortcut="⌘K" />`,
          },
        ],
        designMd: `# ${input.name} — Design System Specification\n\n- **Source**: \`${input.sourceType}\` (${input.sourceUrl || "workspace-native"})\n- **Primary Accent**: \`${primary}\`\n- **Surface Hierarchy**: \`#090a10\` canvas -> \`#121524\` card -> \`#262b44\` 1px hairline border.\n- **AI Generation Contract**: Always use tokenized radii (\`12px\`–\`16px\`), WCAG AA text contrast, and reusable \`PrimaryButton\` / \`KpiMetricCard\` primitives.`,
      },
      providerUsed: this.id,
    };
  }

  async auditPullRequest(input: AuditPrInput): Promise<{
    audit: PrAuditPayload;
    providerUsed: "deterministic";
  }> {
    return {
      audit: {
        status: "NEEDS_ATTENTION",
        score: 89,
        summary: `Audited PR #${input.prNumber} (${input.prTitle}) on ${input.repoFullName} [${input.branchName}] against ${input.designSystemName || "Polaris FinTech UI"}. 2 token/accessibility warnings detected.`,
        findings: [
          {
            file: "src/components/checkout/PaymentSummaryCard.tsx",
            line: 42,
            rule: "design-system/no-hardcoded-hex",
            severity: "medium",
            message: "Hardcoded hex `#6366f1` bypasses Design System token `colors.primary` (`#7c3aed`).",
            suggestion: "Replace inline hex with `var(--ds-color-primary)` or `bg-uxp-accent`.",
          },
          {
            file: "src/components/checkout/PromoCodeModal.tsx",
            line: 78,
            rule: "ux-a11y/touch-target-size",
            severity: "high",
            message: "Dismiss icon button is 24×24px on mobile breakpoint (< 44×44px minimum target).",
            suggestion: "Add `min-h-[44px] min-w-[44px]` touch hit area around the close button.",
          },
          {
            file: "src/app/checkout/page.tsx",
            line: 19,
            rule: "ux-states/empty-and-error-boundary",
            severity: "low",
            message: " Verified skeleton loading state and retry action are present.",
            suggestion: "No change required.",
          },
        ],
      },
      providerUsed: this.id,
    };
  }
}
