import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTenants, getAdminStats } from '@/lib/queries';
import AdminCockpit from '@/components/admin/AdminCockpit';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'SuperAdmin' && session.user.role !== 'TenantAdmin') redirect('/jobs');

  const [tenants] = await Promise.all([getTenants(), getAdminStats()]);

  return (
    <AdminCockpit
      tenants={tenants.map((t) => ({
        id: t.id,
        company: t.company,
        roles: 0,
        users: 0,
        region: 'Global',
        status: t.status ?? 'Active',
      }))}
    />
  );
}
