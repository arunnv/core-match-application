import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { candidates, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  props: RouteContext<'/api/jobs/[id]/candidates/[candidateId]'>
) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'SuperAdmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: jobId, candidateId } = await props.params;

  // Verify job belongs to tenant
  const [job] = await db.select({ id: jobs.id }).from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, session.user.tenantId)))
    .limit(1);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [deleted] = await db.delete(candidates)
    .where(and(eq(candidates.id, candidateId), eq(candidates.jobId, jobId)))
    .returning({ id: candidates.id });

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: deleted.id, deleted: true });
}
