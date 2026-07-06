import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'GEMINI_API_KEY is not set in environment variables.' });
  }

  try {
    // Fetch model metadata only — zero tokens consumed, no cost
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro?key=${apiKey}`,
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error?.message ?? `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai-status] check failed:', msg);

    const friendly =
      msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') ? 'Invalid Gemini API key. Check GEMINI_API_KEY in environment variables.' :
      msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') ? 'Gemini API quota exceeded. Try again later.' :
      msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('UND_ERR') ? 'Cannot reach Gemini API. Check server network connectivity.' :
      msg.includes('403') ? 'Gemini API access denied. Ensure the Generative Language API is enabled in Google Cloud.' :
      msg;

    return NextResponse.json({ ok: false, error: friendly });
  }
}
