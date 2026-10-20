import { prisma } from "./prisma";

export interface AuditLogInput {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditLog(input: AuditLogInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId || null,
        actorEmail: input.actorEmail || "system@uxpilot.local",
        actorRole: input.actorRole || "System",
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId || null,
        summary: input.summary,
        metadataJson: JSON.stringify(input.metadata || {}),
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
    return null;
  }
}
