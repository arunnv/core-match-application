import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

async function getGoogleToken(userId: string): Promise<string | null> {
  const [account] = await db
    .select({ access_token: accounts.access_token, refresh_token: accounts.refresh_token, expires_at: accounts.expires_at })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'google')))
    .limit(1);

  if (!account) return null;

  // Token still valid
  const expiresAt = account.expires_at ? account.expires_at * 1000 : 0;
  if (Date.now() < expiresAt - 60_000) return account.access_token ?? null;

  // Refresh if we have a refresh token
  if (account.refresh_token) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const newExpiresAt = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
      await db.update(accounts)
        .set({ access_token: data.access_token, expires_at: newExpiresAt })
        .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'google')));
      return data.access_token;
    }
  }

  // Token expired and no refresh token — signal re-auth needed
  return null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const spreadsheetId = searchParams.get('spreadsheetId')?.trim();
  const sheetName = searchParams.get('sheetName')?.trim();
  const mode = searchParams.get('mode') ?? 'rows'; // 'sheets' | 'rows'

  if (!spreadsheetId) return NextResponse.json({ error: 'spreadsheetId is required' }, { status: 400 });

  const token = await getGoogleToken(session.user.id);
  if (!token) {
    return NextResponse.json({
      error: 'no_google_token',
      message: 'No Google account linked. Please sign in with Google to use this feature.',
    }, { status: 403 });
  }

  // Mode: list sheet tabs
  if (mode === 'sheets') {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err?.error?.message ?? `HTTP ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    const sheets = (data.sheets ?? []).map((s: { properties: { title: string } }) => s.properties.title);
    return NextResponse.json({ sheets });
  }

  // Mode: fetch rows from a specific sheet
  if (!sheetName) return NextResponse.json({ error: 'sheetName is required' }, { status: 400 });

  const range = `${encodeURIComponent(sheetName)}`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err?.error?.message ?? `HTTP ${res.status}` }, { status: res.status });
  }
  const data = await res.json();
  const rows: string[][] = data.values ?? [];
  if (rows.length === 0) return NextResponse.json({ headers: [], rows: [] });

  const [headers, ...dataRows] = rows;
  return NextResponse.json({ headers, rows: dataRows });
}
