import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'GEMINI_API_KEY is not set in environment variables.',
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai-status] Gemini ping failed:', msg);
    const friendly =
      msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') ? 'Invalid Gemini API key. Check GEMINI_API_KEY in environment variables.' :
      msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') ? 'Gemini API quota exceeded. Try again later.' :
      msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('UND_ERR') ? 'Cannot reach Gemini API. Check server network connectivity.' :
      msg.includes('403') ? 'Gemini API access denied. Verify your API key has the Generative Language API enabled.' :
      msg;
    return NextResponse.json({ ok: false, error: friendly });
  }
}
