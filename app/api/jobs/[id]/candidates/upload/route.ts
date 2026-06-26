import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { candidates } from '@/db/schema';
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
  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  if (files.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 files per upload' }, { status: 400 });
  }

  const createdIds: string[] = [];

  for (const file of files) {
    if (!isAllowedMime(file.type, file.name)) {
      continue; // skip unsupported formats silently
    }

    // Insert placeholder row immediately
    const [row] = await db
      .insert(candidates)
      .values({ jobId, name: file.name.replace(/\.[^.]+$/, ''), status: 'processing', fileName: file.name })
      .returning({ id: candidates.id });

    if (!row) continue;
    createdIds.push(row.id);

    // Fire-and-forget scoring
    const buffer = Buffer.from(await file.arrayBuffer());
    void (async () => {
      try {
        const text = await extractText(buffer, file.type, file.name);
        await scoreCandidate(row.id, text, jobId);
      } catch (err) {
        console.error('[upload] scoring error:', err);
      }
    })();
  }

  return NextResponse.json({ created: createdIds, total: createdIds.length }, { status: 201 });
}
