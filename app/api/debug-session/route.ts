import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('authjs.session-token');
  const session = await auth();
  return NextResponse.json({
    hasCookie: !!sessionCookie,
    cookiePreview: sessionCookie?.value?.slice(0, 30) ?? null,
    hasSession: !!session,
    user: session?.user ?? null,
  });
}
