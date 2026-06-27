import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const ADMIN_ROLES = new Set(['SuperAdmin', 'TenantAdmin']);

const ToggleUserSchema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest, props: RouteContext<'/api/admin/users/[id]'>) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.has(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  const [updated] = await db
    .update(users)
    .set({ enabled: result.data.enabled })
    .where(and(eq(users.id, id), eq(users.tenantId, session.user.tenantId!)))
    .returning({ id: users.id, enabled: users.enabled });

  if (!updated) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
