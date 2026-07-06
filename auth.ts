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
import { logAuthentication } from '@/lib/queries';

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
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          scope: 'openid email profile https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          ?? request.headers.get('x-real-ip')
          ?? null;
        const ua = request.headers.get('user-agent') ?? null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash || !user.enabled) {
          // Log failed attempt if we found a user account
          if (user?.id) {
            void logAuthentication({ userId: user.id, ipAddress: ip, userAgent: ua, authMethod: 'Email', status: 'Failed' });
          }
          return null;
        }

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) {
          void logAuthentication({ userId: user.id, ipAddress: ip, userAgent: ua, authMethod: 'Email', status: 'Failed' });
          return null;
        }

        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
        void logAuthentication({ userId: user.id, ipAddress: ip, userAgent: ua, authMethod: 'Email', status: 'Success' });

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

            if (account?.provider === 'google') {
              // Persist Google OAuth tokens so the Sheets integration can use them
              if (account.access_token || account.refresh_token) {
                await db.update(accounts)
                  .set({
                    access_token: account.access_token ?? undefined,
                    refresh_token: account.refresh_token ?? undefined,
                    expires_at: account.expires_at ?? undefined,
                  })
                  .where(
                    eq(accounts.userId, userId)
                  );
              }
              void logAuthentication({
                userId: dbUser.id,
                ipAddress: null,
                userAgent: null,
                authMethod: 'Google SSO',
                status: 'Success',
              });
            }
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
