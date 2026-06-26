import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().min(2).max(100).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = RegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });
  }

  const { name, email, password, company } = result.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create tenant for new company, or use first tenant as default
  let tenantId: string | null = null;
  if (company) {
    const [tenant] = await db
      .insert(tenants)
      .values({ company, region: 'us-east-1' })
      .returning({ id: tenants.id });
    tenantId = tenant?.id ?? null;
  } else {
    const [first] = await db.select({ id: tenants.id }).from(tenants).limit(1);
    tenantId = first?.id ?? null;
  }

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: 'Recruiter', tenantId })
    .returning({ id: users.id, email: users.email, name: users.name });

  return NextResponse.json({ user }, { status: 201 });
}
