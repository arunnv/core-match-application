import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  _req: NextRequest,
  props: RouteContext<'/api/uploads/[filename]'>
) {
  const { filename } = await props.params;

  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = join(process.cwd(), 'public', 'uploads', filename);

  try {
    const buffer = await readFile(filePath);
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = ext === 'pdf' ? 'application/pdf'
      : ext === 'doc' ? 'application/msword'
      : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
