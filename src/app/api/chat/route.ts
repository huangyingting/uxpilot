import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";
import { getAIProvider } from "@/lib/ai/provider";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  providerUsed?: string;
  suggestedCanvasPrompt?: string;
}

async function ensureInitialChatThreads(userId: string) {
  const count = await prisma.uxChatThread.count();
  if (count > 0) return;

  const initialMessages: ChatMessage[] = [
    {
      id: "msg-seed-1",
      role: "user",
      content:
        "We need a high-converting mobile onboarding and biometric KYC flow for our NeoBank app. What screens and micro-interactions reduce drop-off?",
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: "msg-seed-2",
      role: "assistant",
      content:
        "### Recommended 3-Step NeoBank KYC & Activation Architecture\n\n1. **Progressive Value Preview (Screen 1)**: Show live APY yield tiers and virtual card preview *before* requesting identity documents.\n2. **Camera-First Document + Biometric Liveness (Screen 2)**: Combine passport/ID auto-crop with a single ring progress indicator and WCAG AA contrast cues.\n3. **Instant Virtual Card Provisioning (Screen 3)**: Immediately reveal Apple Pay / Google Wallet provisioning upon verification.\n\nClick **Generate in AI Canvas** below to materialize this 3-screen flow directly on your workspace canvas.",
      createdAt: new Date(Date.now() - 3550_000).toISOString(),
      providerUsed: "copilot-sdk",
      suggestedCanvasPrompt:
        "3-step NeoBank biometric KYC onboarding flow with progressive APY value preview, camera liveness scanner, and instant virtual card wallet provisioning",
    },
  ];

  await prisma.uxChatThread.create({
    data: {
      userId,
      title: "NeoBank Biometric KYC & Onboarding Strategy",
      contextType: "ux-research",
      messagesJson: JSON.stringify(initialMessages),
    },
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

  await ensureInitialChatThreads(actor.id);

  const threads = await prisma.uxChatThread.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    threads: threads.map((t) => ({
      id: t.id,
      title: t.title,
      contextType: t.contextType,
      messages: JSON.parse(t.messagesJson || "[]") as ChatMessage[],
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Editor")) {
    return NextResponse.json(
      { error: "Editor role required to send AI UX Copilot messages." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const messageText = String(body.message || "").trim();
  const contextType = String(body.contextType || "ux-research");
  if (!messageText) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const provider = getAIProvider();
  const enhanced = await provider.enhancePrompt({
    prompt: messageText,
    scope: "global",
    platform: "desktop",
    mode: "hifi",
  });

  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}-u`,
    role: "user",
    content: messageText,
    createdAt: new Date().toISOString(),
  };

  const assistantMsg: ChatMessage = {
    id: `msg-${Date.now()}-a`,
    role: "assistant",
    content: `### UX Copilot Synthesis (${contextType.toUpperCase()})\n\n- **Primary UX Recommendation**: Structure the primary viewport around a clear F-pattern visual hierarchy with a single high-contrast primary CTA above the fold.\n- **Accessibility & Token Guardrails**: Enforce 4.5:1 text contrast, \`44×44px\` minimum touch targets, and semantic surface tokens (\`#090d16\` canvas -> \`#111827\` card).\n- **Production Canvas Prompt**:\n> ${enhanced.enhancedPrompt}`,
    createdAt: new Date().toISOString(),
    providerUsed: enhanced.providerUsed,
    suggestedCanvasPrompt: enhanced.enhancedPrompt,
  };

  let thread = body.threadId
    ? await prisma.uxChatThread.findUnique({ where: { id: String(body.threadId) } })
    : null;

  if (!thread) {
    thread = await prisma.uxChatThread.create({
      data: {
        userId: actor.id,
        title: messageText.slice(0, 56),
        contextType,
        messagesJson: JSON.stringify([userMsg, assistantMsg]),
      },
    });
  } else {
    const existing = JSON.parse(thread.messagesJson || "[]") as ChatMessage[];
    thread = await prisma.uxChatThread.update({
      where: { id: thread.id },
      data: {
        messagesJson: JSON.stringify([...existing, userMsg, assistantMsg]),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    thread: {
      id: thread.id,
      title: thread.title,
      contextType: thread.contextType,
      messages: JSON.parse(thread.messagesJson || "[]") as ChatMessage[],
      updatedAt: thread.updatedAt.toISOString(),
    },
  });
}
