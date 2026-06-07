import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
          },
        });

        if (!user?.isActive) return null;
        if (!user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      if (!token.sub) return token;

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
          staff: true,
        },
      });

      const roleKeys = user?.roles.map((r) => r.role.key) ?? [];
      const permissionKeys = new Set<string>();
      for (const ur of user?.roles ?? []) {
        for (const rp of ur.role.permissions) permissionKeys.add(rp.permission.key);
      }

      token.roles = roleKeys;
      token.permissions = Array.from(permissionKeys);
      token.staffId = user?.staffId ?? null;
      token.isActive = user?.isActive ?? false;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.roles = (token.roles as string[] | undefined) ?? [];
        session.user.permissions = (token.permissions as string[] | undefined) ?? [];
        session.user.staffId = (token.staffId as string | null | undefined) ?? null;
        session.user.isActive = (token.isActive as boolean | undefined) ?? false;
      }
      return session;
    },
  },
};

export const nextAuthHandler = NextAuth(authOptions);

