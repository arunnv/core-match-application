import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProfileCard from '@/components/profile/ProfileCard';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      enabled: users.enabled,
      lifetimeCredits: users.lifetimeCredits,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      tenantName: tenants.company,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row) redirect('/login');

  return (
    <ProfileCard
      user={{
        id: row.id,
        name: row.name ?? '',
        email: row.email ?? '',
        image: row.image ?? null,
        role: row.role,
        enabled: row.enabled,
        lifetimeCredits: row.lifetimeCredits,
        lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        tenantName: row.tenantName ?? null,
      }}
    />
  );
}
