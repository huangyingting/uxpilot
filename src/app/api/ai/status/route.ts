import { NextRequest, NextResponse } from "next/server";
import { getAIProviderStatus, setRuntimeAIProvider } from "@/lib/ai/provider";
import type { AIProviderId } from "@/lib/ai/types";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  return NextResponse.json(getAIProviderStatus());
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Admin")) {
    return NextResponse.json({ error: "Admin role required to switch AI provider." }, { status: 403 });
  }

  const body = await req.json();
  const provider = body.provider as AIProviderId;
  if (!["copilot-sdk", "azure-openai", "deterministic"].includes(provider)) {
    return NextResponse.json({ error: "Unsupported AI provider." }, { status: 400 });
  }

  setRuntimeAIProvider(provider, body.modelName);

  await recordAuditLog({
    actorUserId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "ai.provider_switch",
    targetType: "ai_provider",
    targetId: provider,
    summary: `Switched active AI provider to ${provider}${body.modelName ? ` (${body.modelName})` : ""}`,
  });

  return NextResponse.json(getAIProviderStatus());
}
