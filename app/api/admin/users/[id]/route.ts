import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ToggleUserSchema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest, props: RouteContext<'/api/admin/users/[id]'>) {
  const { id } = await props.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = ToggleUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });
  }

  // TODO: update DB
  return NextResponse.json({ id, enabled: result.data.enabled });
}
