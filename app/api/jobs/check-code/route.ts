import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const code = req.nextUrl.searchParams.get('code')?.trim();
  if (!code) return NextResponse.json({ exists: false });

  const [row] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.code, code)).limit(1);
  return NextResponse.json({ exists: !!row });
}
