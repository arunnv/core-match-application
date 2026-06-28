import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const ADMIN_ROLES = new Set(['SuperAdmin', 'TenantAdmin', 'RecruitmentLead']);

const PatchJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  location: z.string().min(1).max(100).optional(),
  experience: z.string().max(100).optional(),
  contractDuration: z.string().max(100).optional(),
  description: z.string().optional(),
  workMode: z.enum(['Remote', 'Hybrid', 'On-Site']).optional(),
  status: z.enum(['Active', 'Archived', 'Draft']).optional(),
});

export async function GET(_req: NextRequest, props: RouteContext<'/api/jobs/[id]'>) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await props.params;
  const [job] = await db.select().from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.tenantId, session.user.tenantId)))
    .limit(1);

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(request: NextRequest, props: RouteContext<'/api/jobs/[id]'>) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await props.params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const result = PatchJobSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });
  }

  const [updated] = await db
    .update(jobs)
    .set(result.data)
    .where(and(eq(jobs.id, id), eq(jobs.tenantId, session.user.tenantId)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ job: updated });
}

export async function DELETE(_req: NextRequest, props: RouteContext<'/api/jobs/[id]'>) {
  const session = await auth();
  if (!session?.user?.tenantId || !ADMIN_ROLES.has(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await props.params;
  const [deleted] = await db
    .update(jobs)
    .set({ status: 'Archived' })
    .where(and(eq(jobs.id, id), eq(jobs.tenantId, session.user.tenantId)))
    .returning({ id: jobs.id });

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: deleted.id, archived: true });
}
