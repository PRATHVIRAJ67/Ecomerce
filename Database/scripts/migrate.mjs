#!/usr/bin/env node
/**
 * Applies Database/migrations/*.sql (in filename order) to the ONE shared Supabase database.
 * Tracks applied files in public.schema_migrations. Each file runs in its own transaction.
 *
 *   node Database/scripts/migrate.mjs            # apply pending migrations
 *   node Database/scripts/migrate.mjs --seed     # also run Database/seed/*.sql
 *   node Database/scripts/migrate.mjs --status   # list applied / pending
 *
 * Reads DATABASE_URL + DATABASE_SSL from Database/config/.env (see .env.example there).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(here, '..');
dotenv.config({ path: path.join(dbDir, 'config', '.env'), quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✖ DATABASE_URL missing. Copy Database/config/.env.example to Database/config/.env');
  process.exit(1);
}
const sslMode = process.env.DATABASE_SSL ?? 'no-verify';
const ssl = sslMode === 'disable' ? false : { rejectUnauthorized: sslMode === 'verify' };

const args = new Set(process.argv.slice(2));
const client = new pg.Client({ connectionString: url, ssl });

const sqlFiles = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => ({ name: f, file: path.join(dir, f) }))
    : [];

try {
  await client.connect();
  const { rows: [info] } = await client.query('select current_database() as db, version() as version');
  console.log(`✔ Connected to ${info.db} — ${info.version.split(',')[0]}`);

  await client.query(`create table if not exists public.schema_migrations (
    name text primary key, applied_at timestamptz not null default now())`);
  await client.query('alter table public.schema_migrations enable row level security');
  const applied = new Set((await client.query('select name from public.schema_migrations')).rows.map((r) => r.name));
  const migrations = sqlFiles(path.join(dbDir, 'migrations'));

  if (args.has('--status')) {
    for (const m of migrations) console.log(`${applied.has(m.name) ? '✔ applied ' : '… pending '} ${m.name}`);
    process.exit(0);
  }

  for (const m of migrations) {
    if (applied.has(m.name)) continue;
    process.stdout.write(`→ applying ${m.name} … `);
    try {
      await client.query('begin');
      await client.query(fs.readFileSync(m.file, 'utf8'));
      await client.query('insert into public.schema_migrations (name) values ($1)', [m.name]);
      await client.query('commit');
      console.log('done');
    } catch (err) {
      await client.query('rollback');
      console.log('FAILED');
      throw err;
    }
  }

  if (args.has('--seed')) {
    for (const s of sqlFiles(path.join(dbDir, 'seed'))) {
      process.stdout.write(`→ seeding ${s.name} … `);
      await client.query(fs.readFileSync(s.file, 'utf8'));
      console.log('done');
    }
  }
  console.log('✔ Database is up to date');
} catch (err) {
  console.error('✖', err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
