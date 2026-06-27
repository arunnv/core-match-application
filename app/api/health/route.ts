import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  try {
    // One-row ping — proves the connection pool is alive and the DB is reachable
    await db.execute(sql`SELECT 1`);
  } catch (err) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        db: 'unreachable',
        error: err instanceof Error ? err.message : 'unknown',
        uptime: process.uptime(),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    db: 'reachable',
    latency_ms: Date.now() - start,
    uptime: process.uptime(),
    node: process.version,
    env: process.env.NODE_ENV,
  });
}
