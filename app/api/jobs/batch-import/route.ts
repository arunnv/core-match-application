import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { z } from 'zod';

const JobRowSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  location: z.string().default('Remote'),
  experience: z.string().optional(),
  description: z.string().optional(),
  workMode: z.enum(['Remote', 'Hybrid', 'On-Site']).default('Remote'),
});

const BatchImportSchema = z.object({
  rows: z.array(JobRowSchema).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BatchImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const { rows } = parsed.data;

  const inserted = await db
    .insert(jobs)
    .values(rows.map(r => ({
      tenantId: session.user.tenantId!,
      createdBy: session.user.id,
      title: r.title,
      code: r.code,
      location: r.location,
      experience: r.experience ?? null,
      description: r.description ?? null,
      workMode: r.workMode,
      status: 'Active' as const,
    })))
    .onConflictDoNothing()
    .returning({ id: jobs.id, code: jobs.code });

  return NextResponse.json({ imported: inserted.length, skipped: rows.length - inserted.length });
}
