import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const ADMIN_ROLES = new Set(['SuperAdmin', 'TenantAdmin']);

function isAdmin(role?: string | null) {
  return role && ADMIN_ROLES.has(role);
}

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(['SuperAdmin', 'TenantAdmin', 'RecruitmentLead', 'HiringManager', 'Recruiter']).default('Recruiter'),
  tenantId: z.string().uuid().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      enabled: users.enabled,
      tenantId: users.tenantId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, session.user.tenantId!));

  return NextResponse.json({ users: allUsers, total: allUsers.length });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

  const { password, ...userData } = result.data;
  const tenantId = userData.tenantId ?? session.user.tenantId;

  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, tenantId!)).limit(1);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : null;

  const [newUser] = await db.insert(users).values({
    ...userData,
    tenantId,
    passwordHash,
    enabled: true,
    lifetimeCredits: 0,
  }).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    enabled: users.enabled,
    createdAt: users.createdAt,
  });

  return NextResponse.json({ user: newUser }, { status: 201 });
}
