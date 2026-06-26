import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllUsers, getUsersByTenant } from '@/lib/queries';
import AdminUsers from '@/components/admin/AdminUsers';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'SuperAdmin' && session.user.role !== 'TenantAdmin') redirect('/jobs');

  const userRows = session.user.role === 'SuperAdmin'
    ? await getAllUsers()
    : await getUsersByTenant(session.user.tenantId!);

  return (
    <AdminUsers
      initialUsers={userRows.map((u) => ({
        id: u.id,
        name: u.name ?? u.email ?? 'Unknown',
        role: u.role ?? 'Recruiter',
        lastLogin: u.lastLoginAt ? u.lastLoginAt.toLocaleDateString() : 'Never',
        credits: 0,
        enabled: true,
      }))}
    />
  );
}
