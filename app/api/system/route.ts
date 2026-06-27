import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';

const ADMIN_ROLES = new Set(['SuperAdmin', 'TenantAdmin']);

const SystemConfigSchema = z.object({
  modelEngine: z.enum(['Gemini 1.5 Pro', 'Gemini 1.5 Flash']).optional(),
  maintenanceMode: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.has(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ modelEngine: 'Gemini 1.5 Pro', maintenanceMode: false });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.has(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = SystemConfigSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });
  }

  return NextResponse.json({ updated: result.data });
}
