import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;

  // Always allow auth routes
  if (nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next();

  // Protect all app routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require SuperAdmin or TenantAdmin role
  if (nextUrl.pathname.startsWith('/admin')) {
    const role = session?.user?.role;
    if (role !== 'SuperAdmin' && role !== 'TenantAdmin') {
      return NextResponse.redirect(new URL('/jobs', nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth|api/health).*)',
  ],
};
