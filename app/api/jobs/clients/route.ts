import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, isNotNull, sql } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .selectDistinct({ clientName: jobs.clientName })
    .from(jobs)
    .where(isNotNull(jobs.clientName))
    .orderBy(sql`lower(${jobs.clientName})`);

  return NextResponse.json({ clients: rows.map(r => r.clientName).filter(Boolean) });
}
