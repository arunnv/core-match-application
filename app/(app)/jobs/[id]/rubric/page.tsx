import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getJobById, getCompetenciesByJob } from '@/lib/queries';
import RubricBuilder from '@/components/rubric/RubricBuilder';

export default async function RubricPage(props: PageProps<'/jobs/[id]/rubric'>) {
  const { id } = await props.params;

  const session = await auth();
  if (!session?.user?.tenantId) redirect('/login');

  const job = await getJobById(id);
  if (!job || job.tenantId !== session.user.tenantId) notFound();

  const competencies = await getCompetenciesByJob(id);

  return (
    <RubricBuilder
      jobId={id}
      jobTitle={job.title}
      jobCode={job.code}
      jobLocation={job.location}
      jobWorkMode={job.workMode}
      jobExperience={job.experience ?? ''}
      jobContractDuration={job.contractDuration ?? ''}
      jobDescription={job.description ?? ''}
      initialCompetencies={competencies.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        weight: Number(c.weight),
        sortOrder: c.sortOrder,
      }))}
    />
  );
}
