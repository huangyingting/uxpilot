import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasMinimumRole, resolveSessionActor } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor || !hasMinimumRole(actor.role, "Admin")) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          designPages: true,
          designReviews: true,
        },
      },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      revokedAt: u.revokedAt?.toISOString() || null,
      revokedReason: u.revokedReason,
      planType: u.planType,
      creditsRemaining: u.creditsRemaining,
      creditsTotal: u.creditsTotal,
      pagesCount: u._count.designPages,
      reviewsCount: u._count.designReviews,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}
