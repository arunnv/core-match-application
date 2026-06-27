import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users, accounts, sessions, verificationTokens, tenants } from '@/db/schema';
import type { DefaultSession } from 'next-auth';
import { authConfig } from '@/auth.config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string | null;
    } & DefaultSession['user'];
  }
  interface User {
    role?: string;
    tenantId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;
        if (!user.enabled) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Only query DB on sign-in (when user object is present)
      if (user?.id || account) {
        const userId = user?.id ?? (token.id as string | undefined);
        if (userId) {
          const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          if (dbUser) {
            let tenantId = dbUser.tenantId;
            if (!tenantId) {
              const [firstTenant] = await db.select({ id: tenants.id }).from(tenants).limit(1);
              if (firstTenant) {
                tenantId = firstTenant.id;
                await db.update(users).set({ tenantId, lastLoginAt: new Date() }).where(eq(users.id, userId));
              }
            }
            token.id = dbUser.id;
            token.role = dbUser.role ?? 'Recruiter';
            token.tenantId = tenantId ?? null;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.tenantId = token.tenantId as string | null;
      return session;
    },
  },
});
