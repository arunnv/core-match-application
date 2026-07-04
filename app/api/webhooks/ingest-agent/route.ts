import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { candidates, jobs } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { extractText } from '@/lib/ai/parse-resume';
import { scoreCandidate } from '@/lib/ai/scorer';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const SourceEmailSchema = z.object({
  sender: z.string().default(''),
  subject: z.string().default(''),
  bodyHtml: z.string().default(''),
  receivedAt: z.string().default(() => new Date().toISOString()),
});

function validateApiKey(req: NextRequest): boolean {
  const key = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!key) return false;
  const secret = process.env.AGENT_SECRET_KEY ?? process.env.WEBHOOK_API_KEY ?? '';
  return secret.length > 0 && key === secret;
}

async function parseRequest(req: NextRequest): Promise<{
  candidateName: string;
  jobTitle?: string;
  jobId?: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  sourceEmail?: z.infer<typeof SourceEmailSchema>;
} | { error: string; status: number }> {
  const ct = req.headers.get('content-type') ?? '';

  if (ct.includes('multipart/form-data')) {
    let form: FormData;
    try { form = await req.formData(); } catch {
      return { error: 'Invalid multipart data', status: 400 };
    }
    const candidateName = (form.get('candidateName') as string | null)?.trim();
    if (!candidateName) return { error: 'candidateName is required', status: 422 };

    const file = form.get('resume') as File | null;
    if (!file) return { error: 'resume file is required', status: 422 };

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || 'resume.pdf';
    const mimeType = file.type || 'application/pdf';

    let sourceEmail: z.infer<typeof SourceEmailSchema> | undefined;
    const emailRaw = form.get('sourceEmail');
    if (emailRaw) {
      try {
        const p = SourceEmailSchema.safeParse(JSON.parse(emailRaw as string));
        if (p.success) sourceEmail = p.data;
      } catch { /* ignore */ }
    } else {
      const sender = form.get('emailSender') as string | null;
      if (sender) {
        sourceEmail = SourceEmailSchema.parse({
          sender,
          subject: form.get('emailSubject') ?? '',
          bodyHtml: form.get('emailBodyHtml') ?? '',
          receivedAt: form.get('receivedAt') ?? new Date().toISOString(),
        });
      }
    }

    return {
      candidateName,
      jobTitle: (form.get('jobTitle') as string | null) ?? undefined,
      jobId: (form.get('jobId') as string | null) ?? undefined,
      fileBuffer,
      fileName,
      mimeType,
      sourceEmail,
    };
  }

  // JSON body (base64 resume)
  const JsonSchema = z.object({
    candidateName: z.string().min(1),
    jobTitle: z.string().optional(),
    jobId: z.string().uuid().optional(),
    resumeBase64: z.string().min(1),
    resumeFileName: z.string().default('resume.pdf'),
    resumeMimeType: z.string().default('application/pdf'),
    sourceEmail: SourceEmailSchema.optional(),
  });

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return { error: 'Invalid JSON', status: 400 };
  }

  const p = JsonSchema.safeParse(raw);
  if (!p.success) return { error: 'Validation failed', status: 422 };

  const { candidateName, jobTitle, jobId, resumeBase64, resumeFileName, resumeMimeType, sourceEmail } = p.data;
  return {
    candidateName,
    jobTitle,
    jobId,
    fileBuffer: Buffer.from(resumeBase64, 'base64'),
    fileName: resumeFileName,
    mimeType: resumeMimeType,
    sourceEmail,
  };
}

async function saveFile(buffer: Buffer, fileName: string, candidateId: string): Promise<string> {
  const ext = fileName.split('.').pop() ?? 'pdf';
  const safeName = `${candidateId}.${ext}`;
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(join(uploadsDir, safeName), buffer);
  return `/uploads/${safeName}`;
}

export async function POST(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await parseRequest(req);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { candidateName, jobTitle, jobId: explicitJobId, fileBuffer, fileName, mimeType, sourceEmail } = result;

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

  // jobId may be null — candidate will appear in All Candidates as unassigned

  // ── Insert candidate ──
  const [row] = await db
    .insert(candidates)
    .values({
      ...(jobId ? { jobId } : {}),
      name: candidateName,
      status: 'processing',
      fileName,
      sourceEmail: sourceEmail ?? null,
    })
    .returning({ id: candidates.id });

  if (!row) return NextResponse.json({ error: 'Failed to insert candidate' }, { status: 500 });

  const candidateId = row.id;

  // ── Save file binary to public/uploads ──
  let resumeUrl: string | null = null;
  try {
    resumeUrl = await saveFile(fileBuffer, fileName, candidateId);
    await db.update(candidates).set({ resumeUrl }).where(eq(candidates.id, candidateId));
  } catch (err) {
    console.error('[ingest-agent] file save failed:', err);
  }

  // ── Extract text + score asynchronously (only if assigned to a job) ──
  after(async () => {
    try {
      const text = await extractText(fileBuffer, mimeType, fileName);
      await db.update(candidates).set({ resumeText: text }).where(eq(candidates.id, candidateId));
      if (jobId) {
        await scoreCandidate(candidateId, text, jobId);
      } else {
        await db.update(candidates).set({ status: 'unmatched' }).where(eq(candidates.id, candidateId));
      }
    } catch (err) {
      console.error(`[ingest-agent] post-processing failed for ${candidateId}:`, err);
    }
  });

  return NextResponse.json({ ok: true, candidateId, jobId, resumeUrl, status: 'processing' }, { status: 202 });
}
