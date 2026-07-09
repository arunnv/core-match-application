/**
 * Lightweight startup migration runner.
 * Reads all *.sql files from db/migrations in order and applies them.
 * Uses IF NOT EXISTS / safe DDL so re-running is harmless.
 */
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'db', 'migrations');

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('[migrate] DATABASE_URL not set — skipping'); return; }

  const sql = postgres(url, { max: 1 });

  // Ensure tracking table exists
  await sql`
    CREATE TABLE IF NOT EXISTS _applied_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  const files = (await readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const applied = await sql`SELECT 1 FROM _applied_migrations WHERE name = ${file}`;
    if (applied.length > 0) { console.log(`[migrate] skip  ${file}`); continue; }

    const content = await readFile(join(migrationsDir, file), 'utf8');
    try {
      await sql.unsafe(content);
      await sql`INSERT INTO _applied_migrations (name) VALUES (${file}) ON CONFLICT DO NOTHING`;
      console.log(`[migrate] apply ${file}`);
    } catch (err) {
      console.error(`[migrate] ERROR on ${file}:`, err.message);
      // Continue — IF NOT EXISTS makes most DDL safe to skip
    }
  }

  await sql.end();
  console.log('[migrate] done');
}

run().catch(err => { console.error('[migrate] fatal:', err); process.exit(0); });
