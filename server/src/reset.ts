/**
 * Wipes every row from every application table, keeping the schema.
 *
 * This is destructive and irreversible. It exists because the demo fixtures
 * only ever covered part of the data, and starting genuinely fresh means
 * clearing whatever else accumulated — including real records.
 *
 * Guarded three ways:
 *  - refuses to run when NODE_ENV=production, so it cannot wipe a deployed
 *    Render instance even if the script is wired into a build step;
 *  - prints the masked target host on every run, so it is always obvious which
 *    database is about to be affected;
 *  - `db:reset:dry-run` lists the exact per-table counts without deleting.
 */
import { config } from './config.js'
import { db } from './db.js'
import { migrate } from './db.js'

/**
 * Every table that holds data. Ordered child-first so the intent is readable,
 * though TRUNCATE ... CASCADE makes the order irrelevant.
 */
const TABLES = [
  'provider_documents',
  'provider_applications',
  'availability',
  'notifications',
  'emergency_requests',
  'delivery_orders',
  'payments',
  'appointments',
  'medicines',
  'practitioners',
  'medical_ngos',
  'imaging_centers',
  'laboratories',
  'nurses',
  'ambulances',
  'pharmacies',
  'hospitals',
  'doctors',
  'users',
] as const

function maskedTarget(): string {
  try {
    const url = new URL(config.databaseUrl)
    const host = url.hostname
    const port = url.port ? `:${url.port}` : ''
    return `${host}${port}${url.pathname}`
  } catch {
    return '(unparseable DATABASE_URL)'
  }
}

async function counts(): Promise<Array<{ table: string; rows: number }>> {
  const out: Array<{ table: string; rows: number }> = []
  for (const table of TABLES) {
    const r = await db.query(`SELECT COUNT(*)::int AS n FROM ${table}`)
    out.push({ table, rows: (r.rows[0] as { n: number }).n })
  }
  return out
}

export async function resetData(dryRun: boolean) {
  console.log(`[db:reset] target database: ${maskedTarget()}`)
  console.log(`[db:reset] ssl: ${config.pgSsl ? 'required' : 'disabled'}`)

  if (config.isProduction && !dryRun) {
    console.error('\n[db:reset] Refusing to wipe with NODE_ENV=production.')
    console.error('[db:reset] Run `npm run db:reset:dry-run` to inspect instead.')
    process.exit(1)
  }

  // Make sure the schema exists first, so a reset on an empty database is a
  // no-op rather than a pile of "relation does not exist" errors.
  await migrate()
  const before = await counts()
  const total = before.reduce((sum, t) => sum + t.rows, 0)

  console.log(`\n[db:reset] ${dryRun ? 'DRY RUN — nothing will be deleted.' : 'Deleting all rows.'}`)
  console.log(`[db:reset] ${'table'.padEnd(22)} rows`)
  console.log(`[db:reset] ${'-'.repeat(30)}`)
  for (const { table, rows } of before) {
    console.log(`[db:reset] ${table.padEnd(22)} ${rows}`)
  }
  console.log(`[db:reset] ${'-'.repeat(30)}`)
  console.log(`[db:reset] ${'TOTAL'.padEnd(22)} ${total}\n`)

  if (total === 0) {
    console.log('[db:reset] Database is already empty. Nothing to do.')
    return 0
  }

  if (dryRun) {
    console.log('[db:reset] Dry run complete. Re-run without --dry-run to delete the above.')
    return 0
  }

  // TRUNCATE ... CASCADE handles the provider_documents foreign key and resets
  // any sequences, in a single fast operation per batch.
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  const after = await counts()
  const remaining = after.reduce((sum, t) => sum + t.rows, 0)
  console.log(`[db:reset] Deleted ${total} row(s). ${remaining} row(s) remain.`)
  console.log('[db:reset] The schema is intact, but there are no accounts left — you cannot')
  console.log('[db:reset] sign in until you create one:')
  console.log('')
  console.log('[db:reset]   $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="YourPassword"')
  console.log('[db:reset]   npm run db:admin')
  console.log('')
  console.log('[db:reset] Setting the same pair in .env makes the server create that account')
  console.log('[db:reset] on every boot instead. Add data afterwards with `npm run seed:demo`.')
  return total
}

/** `--dry-run` inspects without deleting. */
const dryRun = process.argv.includes('--dry-run')

resetData(dryRun)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[db:reset] Failed:', err)
    process.exit(1)
  })
