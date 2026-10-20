import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { normalizeEmail, verifyPassword } from "./passwords";
import { recordAuditLog } from "./audit";
import { checkRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email || "");
        const password = credentials?.password || "";
        if (!email || !password) return null;

        const rl = checkRateLimit(`login:${email}`, 25, 60_000);
        if (!rl.allowed) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { passwordCredential: true },
        });

        if (!user) return null;
        if (user.status === "REVOKED" || user.revokedAt) {
          throw new Error("ACCOUNT_REVOKED");
        }

        const storedHash = user.passwordCredential?.passwordHash || "";
        if (!verifyPassword(password, storedHash)) {
          await recordAuditLog({
            actorUserId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            action: "auth.login_failed",
            targetType: "user",
            targetId: user.id,
            summary: `Failed sign-in attempt for ${user.email}`,
          });
          return null;
        }

        await recordAuditLog({
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "auth.login",
          targetType: "user",
          targetId: user.id,
          summary: `User ${user.email} (${user.role}) signed in`,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          planType: user.planType,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: string }).role || "Editor";
        token.status = (user as { status?: string }).status || "ACTIVE";
      } else if (token.id) {
        // Re-sync role & revocation status from database so revocations take effect immediately
        const fresh = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true, status: true, revokedAt: true, name: true },
        });
        if (!fresh || fresh.status === "REVOKED" || fresh.revokedAt) {
          token.status = "REVOKED";
        } else {
          token.role = fresh.role;
          token.status = fresh.status;
          token.name = fresh.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          status?: string;
        };
        u.id = String(token.id || "");
        u.role = String(token.role || "Editor");
        u.status = String(token.status || "ACTIVE");
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "uxpilot-super-secret-nextauth-jwt-key-2026",
};
