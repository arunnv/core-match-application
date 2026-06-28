import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/db';
import { rubricCompetencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getJobById } from '@/lib/queries';

const SaveRubricSchema = z.object({
  competencies: z.array(z.object({
    name: z.string().min(1),
    level: z.enum(['CORE', 'IMPORTANT', 'BONUS']),
    weight: z.number().min(0).max(100),
    sortOrder: z.number().int(),
    mandatory: z.boolean().default(false),
  })).min(1),
});

export async function PUT(req: NextRequest, props: RouteContext<'/api/jobs/[id]/rubric'>) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobId } = await props.params;
  const job = await getJobById(jobId);
  if (!job || job.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const result = SaveRubricSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });

  // Replace all competencies for this job atomically
  await db.delete(rubricCompetencies).where(eq(rubricCompetencies.jobId, jobId));
  await db.insert(rubricCompetencies).values(
    result.data.competencies.map((c) => ({ ...c, jobId }))
  );

  return NextResponse.json({ ok: true });
}
