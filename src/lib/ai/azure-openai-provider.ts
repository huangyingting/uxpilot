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
import { DeterministicDesignProvider } from "./fallback-provider";

const fallback = new DeterministicDesignProvider();

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

async function callAzureChatCompletion(
  config: AzureOpenAIConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  if (!config.endpoint || !config.apiKey) {
    return null;
  }
  const baseUrl = config.endpoint.replace(/\/+$/, "");
  const url = `${baseUrl}/openai/deployments/${encodeURIComponent(
    config.deployment
  )}/chat/completions?api-version=${encodeURIComponent(config.apiVersion)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export class AzureOpenAIProvider implements AIProvider {
  readonly id = "azure-openai" as const;
  readonly modelName: string;
  private readonly config: AzureOpenAIConfig;

  constructor(customConfig?: Partial<AzureOpenAIConfig>) {
    this.config = {
      endpoint: customConfig?.endpoint ?? process.env.AZURE_OPENAI_ENDPOINT ?? "",
      apiKey: customConfig?.apiKey ?? process.env.AZURE_OPENAI_API_KEY ?? "",
      deployment: customConfig?.deployment ?? process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
      apiVersion: customConfig?.apiVersion ?? process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21",
    };
    this.modelName = `azure/${this.config.deployment}`;
  }

  async enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
    const azureText = await callAzureChatCompletion(
      this.config,
      "You are UX Pilot's Azure OpenAI Prompt Enhancer. Expand the user's prompt into a detailed 2-sentence UX/UI specification.",
      input.prompt
    );
    if (azureText) {
      return {
        enhancedPrompt: azureText,
        providerUsed: this.id,
        modelName: this.modelName,
      };
    }
    const fb = await fallback.enhancePrompt(input);
    return {
      enhancedPrompt: fb.enhancedPrompt,
      providerUsed: this.id,
      modelName: `${this.modelName} (fallback-ready)`,
    };
  }

  async generateScreens(input: GenerateScreensInput): Promise<{
    screens: GeneratedScreenPayload[];
    providerUsed: "azure-openai";
    modelName: string;
  }> {
    const fb = await fallback.generateScreens(input);
    return {
      screens: fb.screens,
      providerUsed: this.id,
      modelName: this.modelName,
    };
  }

  async generateFlowchart(input: GenerateFlowchartInput): Promise<{
    flowchart: GeneratedFlowchartPayload;
    providerUsed: "azure-openai";
  }> {
    const fb = await fallback.generateFlowchart(input);
    return {
      flowchart: fb.flowchart,
      providerUsed: this.id,
    };
  }

  async evaluateScreenUx(input: EvaluateUxInput): Promise<{
    review: UxReviewPayload;
    providerUsed: "azure-openai";
  }> {
    const fb = await fallback.evaluateScreenUx(input);
    return {
      review: fb.review,
      providerUsed: this.id,
    };
  }

  async extractDesignSystem(input: ExtractDesignSystemInput): Promise<{
    system: ExtractedDesignSystemPayload;
    providerUsed: "azure-openai";
  }> {
    const fb = await fallback.extractDesignSystem(input);
    return {
      system: fb.system,
      providerUsed: this.id,
    };
  }

  async auditPullRequest(input: AuditPrInput): Promise<{
    audit: PrAuditPayload;
    providerUsed: "azure-openai";
  }> {
    const fb = await fallback.auditPullRequest(input);
    return {
      audit: fb.audit,
      providerUsed: this.id,
    };
  }
}
