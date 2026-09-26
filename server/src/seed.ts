import bcrypt from 'bcryptjs'
import { db } from './db.js'
import { uniqueId } from './helpers.js'

export interface AdminCredentials {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export type AdminResult = { status: 'created' | 'exists'; email: string }

/**
 * Validates credentials and creates the super admin if absent.
 *
 * Also reachable as `npm run db:admin`, which is the supported way to get the
 * first account into a freshly wiped database — `db:reset` leaves you with no
 * way to sign in, and the env vars the server reads on boot are often unset.
 *
 * An id collision on `u_admin` is resolved by generating a new one, so a
 * previous admin that was deleted does not block creating a replacement.
 */
export async function createAdmin(credentials: AdminCredentials): Promise<AdminResult> {
  const email = credentials.email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid admin email: "${credentials.email}"`)
  }
  if (credentials.password.length < 8) {
    throw new Error('Admin password must be at least 8 characters.')
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email])
  if ((existing.rowCount ?? 0) > 0) {
    return { status: 'exists', email }
  }

  const id = uniqueId('u')
  const hash = await bcrypt.hash(credentials.password, 10)
  await db.query(
    `INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, photo, provider_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'admin', $7, NULL, NULL)`,
    [
      id,
      credentials.firstName?.trim() || 'Super',
      credentials.lastName?.trim() || 'Admin',
      '+261 00 00 000 00',
      email,
      hash,
      'Antananarivo',
    ],
  )
  return { status: 'created', email }
}

/**
 * Boot-time bootstrap. Silent when the env vars are absent so a deployed
 * instance without them is not noisy, but a *half*-configured pair is a
 * mistake worth reporting rather than ignoring.
 */
export async function ensureAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD

  if (!email && !password) return

  if (!email || !password) {
    console.warn(
      `[boot] ADMIN_EMAIL and ADMIN_PASSWORD must both be set; only ${
        email ? 'ADMIN_EMAIL' : 'ADMIN_PASSWORD'
      } was provided — super admin was not created.`,
    )
    return
  }

  try {
    const result = await createAdmin({ email, password })
    if (result.status === 'created') console.log(`[boot] Super admin created (${result.email}).`)
  } catch (err) {
    console.error('[boot] Could not create the super admin:', err instanceof Error ? err.message : err)
  }
}
