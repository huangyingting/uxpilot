import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAIProviderStatus } from "@/lib/ai/provider";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    const dbLatencyMs = Date.now() - startedAt;
    const aiStatus = getAIProviderStatus();

    return NextResponse.json({
      ok: true,
      status: "healthy",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        connected: true,
        latencyMs: dbLatencyMs,
        engine: (process.env.DATABASE_URL || "").startsWith("postgres")
          ? "postgresql"
          : "sqlite",
      },
      ai: {
        activeProvider: aiStatus.activeProvider,
        activeModel: aiStatus.activeModel,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        error: err instanceof Error ? err.message : "Database connectivity check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
