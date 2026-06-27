import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllUsers, getUsersByTenant } from '@/lib/queries';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import AdminUsers from '@/components/admin/AdminUsers';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'SuperAdmin' && session.user.role !== 'TenantAdmin') redirect('/jobs');

  const [userRows, [totalCreditsRow]] = await Promise.all([
    session.user.role === 'SuperAdmin'
      ? getAllUsers()
      : getUsersByTenant(session.user.tenantId!),
    db.select({ total: sql<number>`coalesce(sum(lifetime_credits), 0)` }).from(users),
  ]);

  const totalSignUps = userRows.length;
  const totalCreditsUsed = Number(totalCreditsRow?.total ?? 0);

  return (
    <AdminUsers
      initialUsers={userRows.map((u) => ({
        id: u.id,
        name: u.name ?? u.email ?? 'Unknown',
        role: u.role ?? 'Recruiter',
        lastLogin: u.lastLoginAt ? u.lastLoginAt.toLocaleDateString() : 'Never',
        credits: u.lifetimeCredits ?? 0,
        enabled: u.enabled ?? true,
      }))}
      totalSignUps={totalSignUps}
      totalCreditsUsed={totalCreditsUsed}
    />
  );
}
