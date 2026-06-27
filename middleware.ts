import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled server-side in (app)/layout.tsx and page components.
// This middleware only handles static asset routing.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
