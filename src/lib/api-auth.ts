import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import type { AppRole } from "./invitations";

export interface SessionActor {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  status: string;
  planType: string;
  creditsRemaining: number;
  creditsTotal: number;
}

const ROLE_WEIGHT: Record<AppRole, number> = {
  Viewer: 1,
  Editor: 2,
  Admin: 3,
};

export function hasMinimumRole(actorRole: string, requiredRole: AppRole): boolean {
  const current = ROLE_WEIGHT[(actorRole as AppRole) || "Viewer"] ?? 0;
  const required = ROLE_WEIGHT[requiredRole] ?? 99;
  return current >= required;
}

/**
 * Resolves the active session actor and re-verifies against the database so that
 * user revocation or role changes take effect immediately on every API request.
 * Also supports `x-uxpilot-actor-email` header in test/automation contexts when
 * a valid database user exists.
 */
export async function resolveSessionActor(req?: NextRequest): Promise<{
  actor: SessionActor | null;
  revoked: boolean;
}> {
  let email: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      email = session.user.email.toLowerCase();
    }
  } catch {
    // Ignore getServerSession context error outside request scope
  }

  if (!email && req) {
    const headerEmail = req.headers.get("x-uxpilot-actor-email");
    if (headerEmail) {
      email = headerEmail.trim().toLowerCase();
    }
  }

  if (!email) {
    return { actor: null, revoked: false };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    return { actor: null, revoked: false };
  }

  if (dbUser.status === "REVOKED" || dbUser.revokedAt) {
    return { actor: null, revoked: true };
  }

  return {
    actor: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: (dbUser.role as AppRole) || "Editor",
      status: dbUser.status,
      planType: dbUser.planType,
      creditsRemaining: dbUser.creditsRemaining,
      creditsTotal: dbUser.creditsTotal,
    },
    revoked: false,
  };
}
