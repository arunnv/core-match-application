import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getJobById, getCandidatesByJob } from '@/lib/queries';
import EvaluationDashboard from '@/components/candidates/EvaluationDashboard';

export default async function CandidatesPage(props: PageProps<'/jobs/[id]/candidates'>) {
  const { id } = await props.params;

  const session = await auth();
  if (!session?.user?.tenantId) redirect('/login');

  const job = await getJobById(id);
  if (!job || job.tenantId !== session.user.tenantId) notFound();

  const rows = await getCandidatesByJob(id);

  return (
    <EvaluationDashboard
      jobId={id}
      jobTitle={job.title}
      isSuperAdmin={session.user.role === 'SuperAdmin'}
      candidates={rows.map((c) => ({
        id: c.id,
        name: c.name,
        currentRole: c.currentRole ?? '',
        location: c.location ?? '',
        experience: c.experience ?? '',
        score: c.score ?? 0,
        status: c.status as 'scored' | 'processing',
        tags: (c.tags as string[]) ?? [],
        aiHead: c.aiHead ?? '',
        aiReasoning: (c.aiReasoning as string[]) ?? [],
        capabilities: (c.capabilities as { label: string; note: string; w: number }[]) ?? [],
        gaps: (c.gaps as { label: string; note: string; w: number }[]) ?? [],
      }))}
    />
  );
}
