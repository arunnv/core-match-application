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
    return NextResponse.json({
      ok: false,
      error: msg.includes('API key') ? 'Invalid Gemini API key.' :
             msg.includes('quota') ? 'Gemini API quota exceeded.' :
             msg.includes('network') || msg.includes('fetch') ? 'Cannot reach Gemini API. Check network connectivity.' :
             `Gemini API error: ${msg}`,
    });
  }
}
