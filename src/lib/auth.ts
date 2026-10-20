import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { normalizeEmail, verifyPassword } from "./passwords";
import { recordAuditLog } from "./audit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
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
