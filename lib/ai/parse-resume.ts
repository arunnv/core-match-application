import mammoth from 'mammoth';

async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse v1 — simple Node.js-compatible wrapper around pdfjs
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text.trim();
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
