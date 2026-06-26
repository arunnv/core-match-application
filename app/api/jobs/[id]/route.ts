import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PatchJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(100).optional(),
  experience: z.string().max(100).optional(),
  workMode: z.enum(['Remote', 'Hybrid', 'On-Site']).optional(),
  status: z.enum(['Active', 'Archived', 'Draft']).optional(),
});

export async function GET(_req: NextRequest, props: RouteContext<'/api/jobs/[id]'>) {
  const { id } = await props.params;
  // TODO: query DB
  return NextResponse.json({ id, message: 'Not implemented' }, { status: 501 });
}

export async function PATCH(request: NextRequest, props: RouteContext<'/api/jobs/[id]'>) {
  const { id } = await props.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = PatchJobSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });
  }

  // TODO: update in DB
  return NextResponse.json({ id, updated: result.data });
}

export async function DELETE(_req: NextRequest, props: RouteContext<'/api/jobs/[id]'>) {
  const { id } = await props.params;
  // TODO: soft-delete in DB
  return NextResponse.json({ id, deleted: true });
}
