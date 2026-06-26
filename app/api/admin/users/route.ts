import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['SuperAdmin', 'TenantAdmin', 'RecruitmentLead', 'HiringManager', 'Recruiter']).default('Recruiter'),
  tenantId: z.string().uuid().optional(),
});

export async function GET() {
  // TODO: query DB
  return NextResponse.json({ users: [], total: 0 });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });
  }

  const user = { id: crypto.randomUUID(), ...result.data, enabled: true, lifetimeCredits: 0, createdAt: new Date().toISOString() };
  return NextResponse.json({ user }, { status: 201 });
}
