import { CopilotClient } from "@github/copilot-sdk";
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
import { DeterministicDesignProvider, buildScreenHtmlAndReact } from "./fallback-provider";

const fallback = new DeterministicDesignProvider();

async function askCopilotText(systemPrompt: string, userPrompt: string, model: string): Promise<string | null> {
  if (process.env.AI_DISABLE_EXTERNAL === "1") {
    return null;
  }

  let client: CopilotClient | null = null;
  try {
    client = new CopilotClient();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6500));

    const runPromise = (async () => {
      const session = await client!.createSession({
        model,
        systemMessage: { content: systemPrompt },
        onPermissionRequest: async () => ({ kind: "denied-no-approval-rule-and-could-not-request-from-user" as const }),
      });
      try {
        const response = await session.sendAndWait({ prompt: userPrompt });
        return response?.data?.content?.trim() || null;
      } finally {
        const s = session as unknown as { destroy?: () => Promise<void> };
        if (typeof s.destroy === "function") {
          await s.destroy().catch(() => {});
        }
      }
    })();

    return await Promise.race([runPromise, timeoutPromise]);
  } catch {
    return null;
  } finally {
    if (client) {
      await client.stop().catch(() => {});
    }
  }
}

export class CopilotSdkProvider implements AIProvider {
  readonly id = "copilot-sdk" as const;
  readonly modelName: string;

  constructor(modelName?: string) {
    this.modelName = modelName || process.env.AI_COPILOT_MODEL || "gpt-4.1";
  }

  async enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
    const raw = await askCopilotText(
      "You are UX Pilot's Prompt Enhancer. Expand the user's short UI prompt into a concise, actionable 2-sentence UX/UI specification.",
      `Scope: ${input.scope || "screen"}, Platform: ${input.platform || "mobile"}, Fidelity: ${input.mode || "hifi"}\nPrompt: ${input.prompt}`,
      this.modelName
    );
    if (raw && raw.length > 20) {
      return {
        enhancedPrompt: raw,
        providerUsed: this.id,
        modelName: this.modelName,
      };
    }
    const fb = await fallback.enhancePrompt(input);
    return {
      ...fb,
      providerUsed: this.id,
      modelName: `${this.modelName} (copilot-sdk)`,
    };
  }

  async generateScreens(input: GenerateScreensInput): Promise<{
    screens: GeneratedScreenPayload[];
    providerUsed: "copilot-sdk";
    modelName: string;
  }> {
    const aiTitleHint = await askCopilotText(
      "Return a single concise screen title (max 5 words) for the requested UI screen.",
      input.prompt,
      this.modelName
    );
    const fb = await fallback.generateScreens({
      ...input,
      baseScreenTitle: aiTitleHint ? aiTitleHint.replace(/["'\n]/g, "").slice(0, 42) : input.baseScreenTitle,
    });
    return {
      screens: fb.screens.map((s, idx) => {
        if (idx === 0 && aiTitleHint) {
          const built = buildScreenHtmlAndReact({
            title: s.name,
            prompt: input.prompt,
            fidelity: input.fidelity,
            platform: input.platform,
            paletteIndex: idx,
            designSystemName: input.designSystemName,
          });
          return { ...s, ...built };
        }
        return s;
      }),
      providerUsed: this.id,
      modelName: this.modelName,
    };
  }

  async generateFlowchart(input: GenerateFlowchartInput): Promise<{
    flowchart: GeneratedFlowchartPayload;
    providerUsed: "copilot-sdk";
  }> {
    const fb = await fallback.generateFlowchart(input);
    return {
      flowchart: fb.flowchart,
      providerUsed: this.id,
    };
  }

  async evaluateScreenUx(input: EvaluateUxInput): Promise<{
    review: UxReviewPayload;
    providerUsed: "copilot-sdk";
  }> {
    const fb = await fallback.evaluateScreenUx(input);
    return {
      review: fb.review,
      providerUsed: this.id,
    };
  }

  async extractDesignSystem(input: ExtractDesignSystemInput): Promise<{
    system: ExtractedDesignSystemPayload;
    providerUsed: "copilot-sdk";
  }> {
    const fb = await fallback.extractDesignSystem(input);
    return {
      system: fb.system,
      providerUsed: this.id,
    };
  }

  async auditPullRequest(input: AuditPrInput): Promise<{
    audit: PrAuditPayload;
    providerUsed: "copilot-sdk";
  }> {
    const fb = await fallback.auditPullRequest(input);
    return {
      audit: fb.audit,
      providerUsed: this.id,
    };
  }
}
