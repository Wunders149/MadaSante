/**
 * Creates the first super admin.
 *
 *   npm run db:admin -- --email=you@example.com --password=…
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:admin
 *
 * Credentials come from the environment, which is the reliable channel: a
 * `--flag` would have to survive npm's own argument parsing through the root
 * wrapper, which silently swallows unknown flags. Re-running is harmless — an
 * account that already exists is left alone.
 */
import { config } from '../config.js'
import { db, migrate } from '../db.js'
import { createAdmin } from '../seed.js'

function flag(name: string): string | undefined {
  const prefix = `--${name}=`
  const inline = process.argv.find((a) => a.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  if (index !== -1) return process.argv[index + 1]
  return undefined
}

async function main() {
  const email = flag('email') ?? process.env.ADMIN_EMAIL
  const password = flag('password') ?? process.env.ADMIN_PASSWORD
  const firstName = flag('first-name')
  const lastName = flag('last-name')

  console.log(`[db:admin] target database: ${new URL(config.databaseUrl).hostname}`)

  if (!email || !password) {
    console.error('\n[db:admin] Missing credentials.\n')
    console.error('  PowerShell:')
    console.error('    $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="YourPassword"')
    console.error('    npm run db:admin\n')
    console.error('  bash / zsh:')
    console.error('    ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourPassword npm run db:admin\n')
    console.error('  Persist them in .env instead and the server will create this account')
    console.error('  automatically on every boot.')
    process.exit(1)
  }

  await migrate()
  const result = await createAdmin({ email, password, firstName, lastName })

  if (result.status === 'created') {
    console.log(`[db:admin] Super admin created: ${result.email}`)
    console.log('[db:admin] Sign in at /login and choose the "Super admin" role.')
  } else {
    console.log(`[db:admin] An account already exists for ${result.email}; nothing changed.`)
  }
}

main()
  .then(async () => {
    await db.end()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('[db:admin] Failed:', err instanceof Error ? err.message : err)
    await db.end().catch(() => {})
    process.exit(1)
  })
