import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCandidatesByJob, getJobById } from '@/lib/queries';

export async function GET(req: NextRequest, props: RouteContext<'/api/jobs/[id]/candidates'>) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await props.params;
  const job = await getJobById(id);
  if (!job || job.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await getCandidatesByJob(id);
  return NextResponse.json({ candidates: rows });
}
