import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/db';
import { jobs, rubricCompetencies } from '@/db/schema';
import { getJobsByTenant } from '@/lib/queries';

const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  code: z.string().regex(/^JC#\d+$/, 'Code must match JC#NNNNN format'),
  location: z.string().min(1).max(100),
  experience: z.string().max(100).optional(),
  workMode: z.enum(['Remote', 'Hybrid', 'On-Site']).default('Remote'),
  status: z.enum(['Active', 'Archived', 'Draft']).default('Active'),
  competencies: z.array(z.object({
    name: z.string(),
    level: z.string(),
    weight: z.number().min(0).max(100),
    sortOrder: z.number().int(),
  })).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const jobList = await getJobsByTenant(session.user.tenantId);
  return NextResponse.json({ jobs: jobList, total: jobList.length });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const result = CreateJobSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });

  const { competencies, ...jobData } = result.data;

  let job: typeof jobs.$inferSelect | undefined;
  try {
    [job] = await db.insert(jobs).values({
      ...jobData,
      tenantId: session.user.tenantId,
      createdBy: session.user.id,
    }).returning();
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const causeCode = (err as { cause?: { code?: string } })?.cause?.code;
    if (causeCode === '23505' || msg.includes('unique') || msg.includes('duplicate') || msg.includes('23505')) {
      return NextResponse.json({ error: `Job code ${jobData.code} is already taken — please use a different code.` }, { status: 409 });
    }
    throw err;
  }

  if (competencies?.length && job) {
    await db.insert(rubricCompetencies).values(
      competencies.map((c) => ({ ...c, jobId: job!.id }))
    );
  }

  return NextResponse.json({ job }, { status: 201 });
}
