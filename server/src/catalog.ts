import { db } from './db.js'
import type { DbClient } from './db.js'
import { PROVIDER_ROLES, isProviderRole, uniqueId } from './helpers.js'

/**
 * Catalog (directory) records and pricing rules.
 *
 * Two things live here because both the provider routes and the transactional
 * routes need them, and both need the *server* to be the authority:
 *
 *  - A provider account is backed by a row in the catalog table for its role
 *    (`users.provider_id` points at it). Without that row a freshly approved
 *    provider has no profile, no appointments and no availability.
 *  - Prices, fees and delivery totals are derived here instead of being taken
 *    from the request body.
 */

type Row = Record<string, unknown>

/** Commission added on top of a consultation, as a fraction of the base price. */
export const PLATFORM_FEE_RATE = 0.05

/** Flat delivery fee, waived above `FREE_DELIVERY_ABOVE` Ariary. */
export const DELIVERY_FEE = 3_500
export const FREE_DELIVERY_ABOVE = 20_000

/**
 * Consultation keys.
 *
 * Declared as a mutable tuple rather than `as const` so it can be handed
 * straight to `z.enum()`, which requires `[string, ...string[]]`; the literal
 * element types are preserved either way.
 */
export const CONSULT_TYPES: ['cabinet', 'home', 'hospital'] = ['cabinet', 'home', 'hospital']
export type ConsultationType = (typeof CONSULT_TYPES)[number]

/** Catalog table and display-name column for each provider role. */
export const PROVIDER_TABLE: Record<string, { table: string; nameCol: string }> = {
  doctor: { table: 'doctors', nameCol: 'name' },
  nurse: { table: 'nurses', nameCol: 'name' },
  pharmacy: { table: 'pharmacies', nameCol: 'name' },
  laboratory: { table: 'laboratories', nameCol: 'name' },
  imaging_center: { table: 'imaging_centers', nameCol: 'name' },
  hospital: { table: 'hospitals', nameCol: 'name' },
  ambulance_driver: { table: 'ambulances', nameCol: 'provider' },
}

export function platformFeeFor(basePrice: number): number {
  return Math.round(basePrice * PLATFORM_FEE_RATE)
}

type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: Row[] }> }

/** Look up the catalog record backing a provider account. */
export async function loadProviderRecord(
  role: string,
  providerId: string | null,
  client: Queryable = db,
): Promise<Row | null> {
  if (!providerId) return null
  const mapping = PROVIDER_TABLE[role]
  if (!mapping) return null
  const row = (
    await client.query(`SELECT * FROM ${mapping.table} WHERE id = $1`, [providerId])
  ).rows[0]
  return row ?? null
}

/**
 * Base consultation price for a provider record. Only doctors and nurses carry
 * a price; every other role bills through a different flow, so it reads 0.
 */
export function basePriceFor(record: Row | null, consultationType: string | null | undefined): number {
  if (!record) return 0
  const price = Number(record.price ?? 0)
  if (consultationType === 'home') {
    const home = record.price_home
    return home == null ? price : Number(home)
  }
  return price
}

/** Where the consultation happens, derived from the record rather than the client. */
export function locationFor(
  record: Row | null,
  consultationType: string | null | undefined,
  patientLocation: string | null,
): string {
  const providerLocation = record ? String(record.location ?? '') : ''
  const city = record ? String(record.city ?? '') : ''
  const cityOnly = providerLocation.split(',')[0]
  if (consultationType === 'home') {
    return `${patientLocation || 'Antananarivo'} — À domicile`
  }
  if (consultationType === 'hospital') {
    return `${cityOnly}, ${city} — Hôpital partenaire`.replace(/,\s*,/, ',').replace(/,\s*$/, '')
  }
  return providerLocation
}

/** Delivery fee for a subtotal, free above the threshold. */
export function deliveryFeeFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
}

const DEFAULT_OPENING_HOURS = 'Lundi – Samedi : 08:00 – 18:00'

/**
 * Insert a minimal but valid catalog record for a newly approved provider.
 *
 * The application form only collects identity, org name, phone and location, so
 * every other column gets a neutral placeholder. A price of 0 is deliberate:
 * it marks the profile as not yet configured, which is what `needsSetup`
 * reports and what the booking endpoint refuses to take.
 */
export async function createProviderRecord(
  client: DbClient,
  input: {
    role: string
    orgName: string
    phone: string
    location: string
    city: string
  },
): Promise<string> {
  const { role, orgName, phone, location, city } = input
  const id = uniqueId(`pr_${role}`)
  const name = orgName.trim() || 'Professionnel'

  switch (role) {
    case 'doctor':
      await client.query(
        `INSERT INTO doctors (id, name, specialty, type, location, city, consultation_types, price, price_home, availability, availability_slots, photo, rating, reviews, description, languages)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NULL, '[]', '[]', NULL, 0, 0, $8, $9)`,
        [id, name, 'Généraliste', 'generalist', location, city, JSON.stringify(['cabinet']), '', JSON.stringify(['mg', 'fr'])],
      )
      break
    case 'nurse':
      await client.query(
        `INSERT INTO nurses (id, name, qualification, location, city, services, availability, price, photo, rating)
         VALUES ($1, $2, $3, $4, $5, '[]', '[]', 0, NULL, 0)`,
        [id, name, 'Infirmier(ère) diplômé(e)', location, city],
      )
      break
    case 'pharmacy':
      await client.query(
        `INSERT INTO pharmacies (id, name, location, city, phone, opening_hours, delivery_available, rating)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 0)`,
        [id, name, location, city, phone, DEFAULT_OPENING_HOURS],
      )
      break
    case 'laboratory':
      await client.query(
        `INSERT INTO laboratories (id, name, location, city, tests, opening_hours, phone, rating)
         VALUES ($1, $2, $3, $4, '[]', $5, $6, 0)`,
        [id, name, location, city, DEFAULT_OPENING_HOURS, phone],
      )
      break
    case 'imaging_center':
      await client.query(
        `INSERT INTO imaging_centers (id, name, location, city, exams, opening_hours, phone, rating)
         VALUES ($1, $2, $3, $4, '[]', $5, $6, 0)`,
        [id, name, location, city, DEFAULT_OPENING_HOURS, phone],
      )
      break
    case 'hospital':
      await client.query(
        `INSERT INTO hospitals (id, name, type, sector, location, city, services, opening_hours, emergency_available, phone, rating, description)
         VALUES ($1, $2, 'general', 'public', $3, $4, '[]', $5, 1, $6, 0, '')`,
        [id, name, location, city, DEFAULT_OPENING_HOURS, phone],
      )
      break
    case 'ambulance_driver':
      await client.query(
        `INSERT INTO ambulances (id, provider, location, city, phone, vehicles, available, response_time)
         VALUES ($1, $2, $3, $4, $5, '[]', 0, $6)`,
        [id, name, location, city, phone, '—'],
      )
      break
    default:
      throw new Error(`Cannot create a catalog record for role "${role}"`)
  }
  return id
}

/**
 * Repair provider accounts that were approved before catalog records existed.
 *
 * The admin approval flow used to create only a `users` row, leaving
 * `provider_id` NULL and no catalog row — so those accounts passed the provider
 * guard but saw an empty console. This backfills them on boot, reusing the org
 * name and city from the approved application where one exists.
 */
export async function backfillProviderRecords(): Promise<number> {
  const orphans = (
    await db.query(
      `SELECT u.id, u.role, u.phone, u.location, u.first_name, u.last_name,
              a.org_name, a.city
         FROM users u
         LEFT JOIN provider_applications a
           ON a.email = u.email AND a.status = 'approved'
        WHERE u.provider_id IS NULL
          AND u.role IN (${PROVIDER_ROLES.map((_, i) => `$${i + 1}`).join(', ')})`,
      [...PROVIDER_ROLES],
    )
  ).rows as Array<Row & { id: string; role: string }>

  let repaired = 0
  for (const user of orphans) {
    if (!isProviderRole(user.role)) continue
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const providerId = await createProviderRecord(client, {
        role: user.role,
        orgName:
          String(user.org_name ?? '') ||
          [user.first_name, user.last_name].filter(Boolean).join(' '),
        phone: String(user.phone ?? ''),
        location: String(user.location ?? ''),
        city: String(user.city ?? user.location ?? ''),
      })
      await client.query('UPDATE users SET provider_id = $1 WHERE id = $2', [providerId, user.id])
      await client.query('COMMIT')
      repaired++
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`[boot] could not backfill catalog record for user ${user.id}:`, err)
    } finally {
      client.release()
    }
  }
  if (repaired > 0) {
    console.log(`[boot] Backfilled ${repaired} provider profile(s) missing a catalog record.`)
  }
  return repaired
}
