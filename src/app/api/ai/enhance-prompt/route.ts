import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (actor && !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json({ error: "Editor role required to run AI prompt enhancer." }, { status: 403 });
  }

  const body = await req.json();
  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const provider = getAIProvider(body.providerOverride);
  const result = await provider.enhancePrompt({
    prompt,
    scope: body.scope || "screen",
    platform: body.platform || "mobile",
    mode: body.mode || "hifi",
  });

  return NextResponse.json(result);
}
