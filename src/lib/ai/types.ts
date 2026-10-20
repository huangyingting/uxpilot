export type AIProviderId = "copilot-sdk" | "azure-openai" | "deterministic";

export interface EnhancePromptInput {
  prompt: string;
  scope?: "global" | "section" | "screen";
  platform?: "mobile" | "desktop";
  mode?: "hifi" | "wireframe";
}

export interface EnhancePromptOutput {
  enhancedPrompt: string;
  providerUsed: AIProviderId;
  modelName: string;
}

export interface GenerateScreensInput {
  prompt: string;
  platform: "mobile" | "desktop";
  fidelity: "hifi" | "wireframe";
  count?: number;
  generationKind?: "standard" | "variations" | "autoflow";
  designSystemName?: string;
  designTokensJson?: string;
  baseScreenTitle?: string;
}

export interface GeneratedScreenPayload {
  name: string;
  screenPrompt: string;
  fidelity: "hifi" | "wireframe";
  platform: "mobile" | "desktop";
  htmlContent: string;
  reactCode: string;
  width: number;
  height: number;
}

export interface GenerateFlowchartInput {
  prompt: string;
  pageTitle?: string;
}

export interface GeneratedFlowchartPayload {
  title: string;
  mermaidCode: string;
  nodes: Array<{
    id: string;
    label: string;
    kind: "start" | "screen" | "decision" | "action" | "end";
    x: number;
    y: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

export interface EvaluateUxInput {
  screenTitle: string;
  htmlContent: string;
  reviewGoal?: string;
}

export interface UxReviewPayload {
  overallScore: number;
  metrics: {
    visualHierarchy: number;
    accessibility: number;
    usability: number;
    copyClarity: number;
    conversion: number;
  };
  findings: Array<{
    id: string;
    category: string;
    severity: "critical" | "warning" | "pass";
    title: string;
    description: string;
    recommendation: string;
  }>;
  heatmapPoints: Array<{
    id: string;
    x: number; // percentage 0..100
    y: number; // percentage 0..100
    intensity: number; // 0..1
    radius: number;
    label: string;
  }>;
  scanpath: Array<{
    step: number;
    x: number; // percentage 0..100
    y: number; // percentage 0..100
    dwellMs: number;
    label: string;
  }>;
  gazeFlow: Array<{
    zone: string;
    percentage: number;
    verdict: string;
  }>;
}

export interface ExtractDesignSystemInput {
  name: string;
  sourceType: "react" | "github" | "figma" | "website";
  sourceUrl?: string;
  accentColor?: string;
}

export interface ExtractedDesignSystemPayload {
  name: string;
  sourceType: "react" | "github" | "figma" | "website";
  tokens: {
    colors: Record<string, string>;
    typography: {
      headingFont: string;
      bodyFont: string;
      monoFont: string;
      scale: string[];
    };
    radii: Record<string, string>;
    spacing: string[];
  };
  components: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    previewHtml: string;
    reactSnippet: string;
  }>;
  designMd: string;
}

export interface AuditPrInput {
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  branchName: string;
  designSystemName?: string;
}

export interface PrAuditPayload {
  status: "PASSED" | "NEEDS_ATTENTION" | "CHANGES_REQUESTED";
  score: number;
  summary: string;
  findings: Array<{
    file: string;
    line: number;
    rule: string;
    severity: "high" | "medium" | "low";
    message: string;
    suggestion: string;
  }>;
}

export interface AIProvider {
  readonly id: AIProviderId;
  readonly modelName: string;
  enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput>;
  generateScreens(input: GenerateScreensInput): Promise<{
    screens: GeneratedScreenPayload[];
    providerUsed: AIProviderId;
    modelName: string;
  }>;
  generateFlowchart(input: GenerateFlowchartInput): Promise<{
    flowchart: GeneratedFlowchartPayload;
    providerUsed: AIProviderId;
  }>;
  evaluateScreenUx(input: EvaluateUxInput): Promise<{
    review: UxReviewPayload;
    providerUsed: AIProviderId;
  }>;
  extractDesignSystem(input: ExtractDesignSystemInput): Promise<{
    system: ExtractedDesignSystemPayload;
    providerUsed: AIProviderId;
  }>;
  auditPullRequest(input: AuditPrInput): Promise<{
    audit: PrAuditPayload;
    providerUsed: AIProviderId;
  }>;
}
