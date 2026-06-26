import mammoth from 'mammoth';

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Use pdfjs-dist (legacy build) which doesn't require canvas
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;

  const textParts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n').trim();
}

export async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return extractPdfText(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ext === 'docx' ||
    ext === 'doc'
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }

  // Plain text fallback
  return buffer.toString('utf-8').trim();
}

export function isAllowedMime(mimeType: string, filename: string): boolean {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];
  const ext = filename.split('.').pop()?.toLowerCase();
  return allowed.includes(mimeType) || ['pdf', 'docx', 'doc', 'txt'].includes(ext ?? '');
}
