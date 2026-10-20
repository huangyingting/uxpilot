import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { hashPassword, normalizeEmail } from "./passwords";
import { recordAuditLog } from "./audit";

export type AppRole = "Admin" | "Editor" | "Viewer";

export function normalizeInviteCode(code: string): string {
  return String(code || "").trim().toUpperCase();
}

export function generateInviteCode(prefix = "UXP"): string {
  const token = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-2026-${token}`;
}

export function computeInvitationStatus(inv: {
  redeemedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}): "PENDING" | "REDEEMED" | "REVOKED" | "EXPIRED" {
  if (inv.revokedAt) return "REVOKED";
  if (inv.redeemedAt) return "REDEEMED";
  if (new Date(inv.expiresAt).getTime() <= Date.now()) return "EXPIRED";
  return "PENDING";
}

export async function validateInvitationCode(rawCode: string, candidateEmail?: string) {
  const code = normalizeInviteCode(rawCode);
  if (!code) {
    return { valid: false, reason: "Invitation code is required." };
  }

  const invitation = await prisma.accountInvitation.findUnique({
    where: { code },
  });

  if (!invitation) {
    return { valid: false, reason: "Invalid invitation code." };
  }

  const status = computeInvitationStatus(invitation);
  if (status === "REVOKED") {
    return { valid: false, reason: "This invitation code has been revoked by an administrator." };
  }
  if (status === "REDEEMED") {
    return { valid: false, reason: "This single-use invitation code has already been redeemed." };
  }
  if (status === "EXPIRED") {
    return { valid: false, reason: "This invitation code has expired." };
  }

  if (invitation.email && candidateEmail) {
    if (normalizeEmail(invitation.email) !== normalizeEmail(candidateEmail)) {
      return {
        valid: false,
        reason: `This invitation is restricted to ${invitation.email}.`,
      };
    }
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      code: invitation.code,
      email: invitation.email,
      assignedRole: invitation.assignedRole as AppRole,
      expiresAt: invitation.expiresAt.toISOString(),
      note: invitation.note,
    },
  };
}

export async function registerUserWithInvitation(input: {
  code: string;
  email: string;
  name: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const name = String(input.name || "").trim() || email.split("@")[0];
  const password = String(input.password || "");

  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const check = await validateInvitationCode(input.code, email);
  if (!check.valid || !check.invitation) {
    throw new Error(check.reason || "Invalid invitation code.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = hashPassword(password);
  const assignedRole = check.invitation.assignedRole || "Editor";

  const created = await prisma.$transaction(async (tx) => {
    const freshInv = await tx.accountInvitation.findUnique({
      where: { id: check.invitation!.id },
    });
    if (
      !freshInv ||
      freshInv.redeemedAt ||
      freshInv.revokedAt ||
      freshInv.expiresAt.getTime() <= Date.now()
    ) {
      throw new Error("Invitation code is no longer valid.");
    }

    const user = await tx.user.create({
      data: {
        email,
        name,
        role: assignedRole,
        status: "ACTIVE",
        planType: assignedRole === "Admin" ? "enterprise" : "pro",
        creditsRemaining: 1500,
        creditsTotal: 1800,
        onboardingCompleted: true,
        passwordCredential: {
          create: {
            passwordHash,
          },
        },
      },
    });

    await tx.accountInvitation.update({
      where: { id: freshInv.id },
      data: {
        redeemedAt: new Date(),
        redeemedByUserId: user.id,
      },
    });

    return user;
  });

  await recordAuditLog({
    actorUserId: created.id,
    actorEmail: created.email,
    actorRole: created.role,
    action: "auth.register",
    targetType: "user",
    targetId: created.id,
    summary: `Registered account ${created.email} (${created.role}) using single-use invitation ${check.invitation.code}`,
    metadata: {
      invitationCode: check.invitation.code,
      assignedRole: created.role,
    },
  });

  return created;
}

export async function createInvitation(input: {
  email?: string | null;
  assignedRole?: AppRole;
  expiresInHours?: number;
  createdByUserId?: string;
  note?: string;
}) {
  const code = generateInviteCode("UXP");
  const expiresAt = new Date(Date.now() + (input.expiresInHours ?? 72) * 3600 * 1000);
  return prisma.accountInvitation.create({
    data: {
      code,
      email: input.email ? normalizeEmail(input.email) : null,
      assignedRole: input.assignedRole || "Editor",
      expiresAt,
      createdByUserId: input.createdByUserId || null,
      note: input.note || null,
    },
  });
}

export async function revokeInvitation(id: string) {
  return prisma.accountInvitation.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function rotateInvitation(id: string, expiresInHours = 72) {
  const existing = await prisma.accountInvitation.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Invitation not found.");
  }
  if (existing.redeemedAt) {
    throw new Error("Cannot rotate an invitation that has already been redeemed.");
  }
  const newCode = generateInviteCode("UXP");
  const newExpiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);
  return prisma.accountInvitation.update({
    where: { id },
    data: {
      code: newCode,
      revokedAt: null,
      expiresAt: newExpiresAt,
    },
  });
}

export async function redeemInvitationAndCreateUser(input: {
  code: string;
  email: string;
  name: string;
  password: string;
}) {
  try {
    const user = await registerUserWithInvitation(input);
    return { ok: true as const, user };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Registration failed",
    };
  }
}
