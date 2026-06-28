import { NextRequest, NextResponse, after } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { candidates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getJobById } from '@/lib/queries';
import { extractText, isAllowedMime } from '@/lib/ai/parse-resume';
import { scoreCandidate } from '@/lib/ai/scorer';

export async function POST(req: NextRequest, props: RouteContext<'/api/jobs/[id]/candidates/upload'>) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobId } = await props.params;
  const job = await getJobById(jobId);
  if (!job || job.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const files = formData.getAll('files') as File[];
  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  if (files.length > 20) return NextResponse.json({ error: 'Maximum 20 files per upload' }, { status: 400 });

  // Read all file buffers before response (File objects are not available after response)
  const toScore: { id: string; buffer: Buffer; mimeType: string; fileName: string }[] = [];

  for (const file of files) {
    if (!isAllowedMime(file.type, file.name)) continue;

    const [row] = await db
      .insert(candidates)
      .values({ jobId, name: file.name.replace(/\.[^.]+$/, ''), status: 'processing', fileName: file.name })
      .returning({ id: candidates.id });

    if (!row) continue;

    const buffer = Buffer.from(await file.arrayBuffer());
    toScore.push({ id: row.id, buffer, mimeType: file.type, fileName: file.name });
  }

  // Use next/server `after` so scoring runs after response is sent
  // and is guaranteed to complete even in serverless environments
  after(async () => {
    for (const { id, buffer, mimeType, fileName } of toScore) {
      try {
        console.log(`[upload] extracting text for candidate ${id}`);
        const text = await extractText(buffer, mimeType, fileName);
        // Persist resume text so SuperAdmin can trigger rescore without re-upload
        await db.update(candidates).set({ resumeText: text }).where(eq(candidates.id, id));
        console.log(`[upload] extracted ${text.length} chars, scoring...`);
        await scoreCandidate(id, text, jobId);
        console.log(`[upload] scored candidate ${id}`);
      } catch (err) {
        console.error(`[upload] error for candidate ${id}:`, err);
      }
    }
  });

  return NextResponse.json({ created: toScore.map((t) => t.id), total: toScore.length }, { status: 201 });
}
