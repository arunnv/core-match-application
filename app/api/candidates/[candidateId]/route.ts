import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  props: RouteContext<'/api/candidates/[candidateId]'>
) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'SuperAdmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { candidateId } = await props.params;

  // Only allows deleting unassigned candidates (jobId IS NULL)
  const [deleted] = await db
    .delete(candidates)
    .where(and(eq(candidates.id, candidateId), isNull(candidates.jobId)))
    .returning({ id: candidates.id });

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: deleted.id, deleted: true });
}
