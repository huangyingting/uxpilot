import type { AIProvider, AIProviderId } from "./types";
import { CopilotSdkProvider } from "./copilot-provider";
import { AzureOpenAIProvider } from "./azure-openai-provider";
import { DeterministicDesignProvider } from "./fallback-provider";

const globalForAI = globalThis as unknown as {
  aiProviderOverride?: AIProviderId;
  aiModelOverride?: string;
};

export function setRuntimeAIProvider(providerId: AIProviderId, modelName?: string) {
  globalForAI.aiProviderOverride = providerId;
  if (modelName) {
    globalForAI.aiModelOverride = modelName;
  }
}

export function getActiveAIProviderId(): AIProviderId {
  if (globalForAI.aiProviderOverride) {
    return globalForAI.aiProviderOverride;
  }
  const envVal = (process.env.AI_PROVIDER || "copilot-sdk").trim().toLowerCase();
  if (envVal === "azure-openai" || envVal === "azure") {
    return "azure-openai";
  }
  if (envVal === "deterministic" || envVal === "mock") {
    return "deterministic";
  }
  return "copilot-sdk";
}

export function getAIProvider(overrideId?: AIProviderId): AIProvider {
  const target = overrideId || getActiveAIProviderId();
  if (target === "azure-openai") {
    return new AzureOpenAIProvider({
      deployment: globalForAI.aiModelOverride || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
    });
  }
  if (target === "deterministic") {
    return new DeterministicDesignProvider();
  }
  return new CopilotSdkProvider(globalForAI.aiModelOverride || process.env.AI_COPILOT_MODEL || "gpt-4.1");
}

export function getAIProviderStatus() {
  const activeId = getActiveAIProviderId();
  const provider = getAIProvider(activeId);
  const providersList = [
    {
      id: "copilot-sdk" as const,
      label: "GitHub Copilot SDK (@github/copilot-sdk)",
      model: process.env.AI_COPILOT_MODEL || "gpt-4.1",
      configured: true,
    },
    {
      id: "azure-openai" as const,
      label: "Azure OpenAI Service (Pluggable Adapter)",
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
      configured: Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY),
    },
    {
      id: "deterministic" as const,
      label: "Deterministic UX Design Engine (Built-in Fallback)",
      model: "uxpilot-deterministic-v2",
      configured: true,
    },
  ];
  return {
    activeProvider: provider.id,
    activeModel: provider.modelName,
    modelName: provider.modelName,
    providers: providersList,
    supportedProviders: providersList,
  };
}
