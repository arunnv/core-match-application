import { NextRequest, NextResponse, after } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { candidates, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { extractText } from '@/lib/ai/parse-resume';
import { scoreCandidate } from '@/lib/ai/scorer';

export async function POST(
  _req: NextRequest,
  props: RouteContext<'/api/jobs/[id]/candidates/[candidateId]/rescore'>
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

  // Fetch candidate — must have stored resume text or fileName
  const [candidate] = await db.select().from(candidates)
    .where(and(eq(candidates.id, candidateId), eq(candidates.jobId, jobId)))
    .limit(1);
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });

  if (!candidate.resumeText) {
    return NextResponse.json({ error: 'No resume text stored for this candidate — re-upload the resume to rescore' }, { status: 422 });
  }

  // Mark as processing so UI shows spinner
  await db.update(candidates).set({ status: 'processing' }).where(eq(candidates.id, candidateId));

  after(async () => {
    try {
      await scoreCandidate(candidateId, candidate.resumeText!, jobId);
    } catch (err) {
      console.error(`[rescore] failed for candidate ${candidateId}:`, err);
    }
  });

  return NextResponse.json({ id: candidateId, status: 'processing' });
}
