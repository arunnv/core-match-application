import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { candidates, jobs } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { extractText } from '@/lib/ai/parse-resume';
import { scoreCandidate } from '@/lib/ai/scorer';

const IngestSchema = z.object({
  candidateName: z.string().min(1),
  jobTitle: z.string().optional(),
  jobId: z.string().uuid().optional(),
  resumeBase64: z.string().min(1),
  resumeFileName: z.string().default('resume.pdf'),
  resumeMimeType: z.string().default('application/pdf'),
  sourceEmail: z.object({
    sender: z.string(),
    subject: z.string(),
    bodyHtml: z.string().default(''),
    receivedAt: z.string().default(() => new Date().toISOString()),
  }).optional(),
});

function validateApiKey(req: NextRequest): boolean {
  const key = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  return !!key && key === process.env.WEBHOOK_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = IngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 422 });
  }

  const { candidateName, jobTitle, jobId: explicitJobId, resumeBase64, resumeFileName, resumeMimeType, sourceEmail } = parsed.data;

  // ── Resolve job ──
  let jobId: string | null = explicitJobId ?? null;

  if (!jobId && jobTitle) {
    const [match] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(ilike(jobs.title, `%${jobTitle}%`))
      .limit(1);
    jobId = match?.id ?? null;
  }

  if (!jobId) {
    return NextResponse.json({ error: 'Could not match a job. Provide jobId or a recognisable jobTitle.' }, { status: 422 });
  }

  // ── Insert candidate ──
  const [row] = await db
    .insert(candidates)
    .values({
      jobId,
      name: candidateName,
      status: 'processing',
      fileName: resumeFileName,
      sourceEmail: sourceEmail ?? null,
    })
    .returning({ id: candidates.id });

  if (!row) return NextResponse.json({ error: 'Failed to insert candidate' }, { status: 500 });

  const candidateId = row.id;
  const buffer = Buffer.from(resumeBase64, 'base64');

  after(async () => {
    try {
      const text = await extractText(buffer, resumeMimeType, resumeFileName);
      await db.update(candidates).set({ resumeText: text }).where(eq(candidates.id, candidateId));
      await scoreCandidate(candidateId, text, jobId!);
    } catch (err) {
      console.error(`[ingest-agent] scoring failed for ${candidateId}:`, err);
    }
  });

  return NextResponse.json({ ok: true, candidateId, jobId, status: 'processing' }, { status: 202 });
}
