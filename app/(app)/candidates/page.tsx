import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllCandidatesByTenant, getJobsByTenant } from '@/lib/queries';
import AllCandidates from '@/components/candidates/AllCandidates';

export default async function AllCandidatesPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect('/login');

  const [rows, jobs] = await Promise.all([
    getAllCandidatesByTenant(session.user.tenantId),
    getJobsByTenant(session.user.tenantId),
  ]);

  return (
    <AllCandidates
      isSuperAdmin={session.user.role === 'SuperAdmin'}
      candidates={rows.map((c) => ({
        id: c.id,
        name: c.name || 'Unknown',
        email: c.email ?? null,
        phone: c.phone ?? null,
        currentRole: c.currentRole ?? '',
        location: c.location ?? '',
        experience: c.experience ?? '',
        score: c.score ?? 0,
        tags: (c.tags as string[]) ?? [],
        aiHead: c.aiHead ?? '',
        status: c.status,
        evaluations: (c.evaluations as {
          competency: string; level: string; weight_percentage: number;
          evidence_quote: string | null; competency_score_0_to_100: number;
          weighted_points_earned: number; reasoning: string;
        }[]) ?? [],
        jobId: c.jobId,
        jobTitle: c.jobTitle,
        jobCode: c.jobCode,
        resumeUrl: c.resumeUrl ?? null,
        sourceEmail: c.sourceEmail as { sender: string; subject: string; bodyHtml: string; receivedAt: string } | null ?? null,
      }))}
      jobs={jobs.map((j) => ({
        id: j.id,
        title: j.title,
        code: j.code,
        location: j.location,
        scored: j.scored,
      }))}
    />
  );
}
