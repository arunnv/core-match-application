import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getJobsByTenant } from '@/lib/queries';
import JobsDashboard from '@/components/jobs/JobsDashboard';

export default async function JobsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect('/login');

  const jobs = await getJobsByTenant(session.user.tenantId);

  return (
    <JobsDashboard
      isSuperAdmin={session.user.role === 'SuperAdmin'}
      initialJobs={jobs.map((j) => ({
        id: j.id,
        code: j.code,
        title: j.title,
        location: j.location,
        experience: j.experience ?? '',
        status: j.status as 'Active' | 'Archived' | 'Draft',
        scored: j.scored,
        processing: j.processing,
      }))}
    />
  );
}
