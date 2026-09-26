import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireProvider } from '../auth.js'
import { publicUser, type UserRow } from '../helpers.js'
import { PROVIDER_TABLE, loadProviderRecord } from '../catalog.js'

export const providersRouter = Router()
// Public, unauthenticated route: catalog of providers for patients to browse.
export const providersRouterPublic = Router()

// Everything mounted on providersRouter is the provider's own account, so it
// must run as an authenticated provider. Registered up front: routes below are
// matched in order, and without this `req.auth` is undefined in the handlers.
providersRouter.use(requireAuth, requireProvider)

type Row = Record<string, unknown>

/**
 * The provider's own catalog record, plus whether it still needs attention.
 *
 * `needsSetup` is true while the record carries a 0 price: approval creates the
 * record with placeholders, and the booking endpoint refuses to take a
 * provider who has not declared what they charge.
 */
async function fetchProfile(role: string, providerId: string | null) {
  const row = await loadProviderRecord(role, providerId)
  if (!row) return undefined
  const mapping = PROVIDER_TABLE[role]
  const price = row.price == null ? undefined : Number(row.price)
  const priceHome = row.price_home == null ? undefined : Number(row.price_home)
  return {
    id: row.id,
    name: row[mapping!.nameCol],
    location: row.location,
    city: row.city,
    role,
    price,
    priceHome,
    specialty: row.specialty ?? undefined,
    description: row.description ?? undefined,
    needsSetup: price === 0,
  }
}

providersRouter.get('/me', async (req: Request, res: Response) => {
  const row = (await db.query('SELECT * FROM users WHERE id = $1', [req.auth!.id])).rows[0] as UserRow
  const user = publicUser(row)
  res.json({ user, provider: await fetchProfile(user.role, user.providerId ?? null) })
})

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
  photo: z.string().optional(),
})

const photoPattern = /^data:image\/(png|jpe?g|webp|gif);base64,/
const MAX_PHOTO_LENGTH = 3_000_000

providersRouter.put('/me', async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const data = parsed.data
  if (data.photo && data.photo.length > MAX_PHOTO_LENGTH) {
    res.status(400).json({ error: 'Photo trop volumineuse' })
    return
  }
  if (data.photo && !photoPattern.test(data.photo)) {
    res.status(400).json({ error: 'Format de photo invalide' })
    return
  }
  const existingRow = (await db.query('SELECT * FROM users WHERE id = $1', [req.auth!.id])).rows[0] as UserRow
  const next = {
    firstName: data.firstName ?? existingRow.first_name,
    lastName: data.lastName ?? existingRow.last_name,
    phone: data.phone ?? existingRow.phone,
    email: data.email ?? existingRow.email,
    location: data.location ?? existingRow.location ?? '',
    photo: data.photo === undefined ? existingRow.photo : data.photo || null,
  }
  if (next.email !== existingRow.email) {
    const clash = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [next.email, req.auth!.id])
    if ((clash.rowCount ?? 0) > 0) {
      res.status(409).json({ error: 'Email déjà utilisé' })
      return
    }
  }
  await db.query(
    `UPDATE users SET first_name = $1, last_name = $2, phone = $3, email = $4, location = $5, photo = $6
     WHERE id = $7`,
    [next.firstName, next.lastName, next.phone, next.email, next.location, next.photo, req.auth!.id],
  )
  const updated = (await db.query('SELECT * FROM users WHERE id = $1', [req.auth!.id])).rows[0] as UserRow
  const user = publicUser(updated)
  res.json({ user, provider: await fetchProfile(user.role, user.providerId ?? null) })
})

// Public, unauthenticated: catalog of providers patients can browse.
// Every UNION branch must project the same columns, and only columns that
// actually exist: hospitals has no photo, nurses no description, ambulances
// neither photo, description nor rating.
const PROVIDER_UNION = `
  SELECT id, 'doctor' AS role, name, location, city, photo, rating, description FROM doctors
  UNION ALL SELECT id, 'nurse' AS role, name, location, city, photo, rating, NULL AS description FROM nurses
  UNION ALL SELECT id, 'pharmacy' AS role, name, location, city, NULL AS photo, rating, NULL AS description FROM pharmacies
  UNION ALL SELECT id, 'laboratory' AS role, name, location, city, NULL AS photo, rating, NULL AS description FROM laboratories
  UNION ALL SELECT id, 'imaging_center' AS role, name, location, city, NULL AS photo, rating, NULL AS description FROM imaging_centers
  UNION ALL SELECT id, 'hospital' AS role, name, location, city, NULL AS photo, rating, description FROM hospitals
  UNION ALL SELECT id, 'ambulance_driver' AS role, provider AS name, location, city, NULL AS photo, NULL AS rating, NULL AS description FROM ambulances
`

providersRouterPublic.get('/', async (req: Request, res: Response) => {
  const role = typeof req.query.role === 'string' ? req.query.role : undefined
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)))
  const offset = (page - 1) * limit
  const where: string[] = []
  const params: unknown[] = []
  if (role && role in PROVIDER_TABLE) {
    where.push('role = ?')
    params.push(role)
  }
  if (typeof req.query.city === 'string' && req.query.city) {
    where.push('city = ?')
    params.push(req.query.city)
  }
  if (typeof req.query.location === 'string' && req.query.location) {
    where.push('location ILIKE ?')
    params.push(`%${req.query.location}%`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = (
    await db.query(
      `SELECT id, role, name, location, city, photo, rating, description
         FROM (${PROVIDER_UNION}) p
        ${whereSql}
        ORDER BY name, id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, offset, limit],
    )
  ).rows as Row[]

  const totalRows = (
    await db.query(`SELECT COUNT(*)::int AS total FROM (${PROVIDER_UNION}) p ${whereSql}`, params)
  ).rows[0] as { total: number }

  const providers = rows.map((r) => ({
    id: r.id,
    role: r.role,
    name: r.name,
    location: r.location ?? undefined,
    city: r.city ?? undefined,
    photo: r.photo ?? undefined,
    rating: Number(r.rating ?? 0),
    description: r.description ?? undefined,
  }))

  const total = Number(totalRows.total)
  res.json({
    providers,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
})

const availabilitySchema = z.object({
  entries: z.array(z.object({ day: z.string(), slot: z.string(), available: z.boolean() })).max(200),
})

/**
 * Availability is keyed on `provider_id`, so an account without one cannot
 * read or write it. Answering 409 here (rather than writing rows keyed on
 * NULL) is what keeps the endpoint honest instead of silently persisting to a
 * shared NULL bucket.
 */
function requireProviderId(req: Request, res: Response): string | null {
  const providerId = req.auth!.providerId
  if (!providerId) {
    res.status(409).json({ error: "Votre profil professionnel n'est pas encore initialisé" })
    return null
  }
  return providerId
}

providersRouter.get('/me/availability', async (req: Request, res: Response) => {
  const providerId = requireProviderId(req, res)
  if (!providerId) return
  const rows = (
    await db.query('SELECT day, slot, available FROM availability WHERE provider_id = ? ORDER BY day, slot', [providerId])
  ).rows as Array<{ day: string; slot: string; available: number }>
  res.json(rows.map((r) => ({ day: r.day, slot: r.slot, available: r.available === 1 })))
})

providersRouter.put('/me/availability', async (req: Request, res: Response) => {
  const parsed = availabilitySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const providerId = requireProviderId(req, res)
  if (!providerId) return
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM availability WHERE provider_id = $1', [providerId])
    for (const e of parsed.data.entries) {
      await client.query(
        'INSERT INTO availability (provider_id, day, slot, available) VALUES ($1, $2, $3, $4)',
        [providerId, e.day, e.slot, e.available ? 1 : 0],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  res.json({ ok: true })
})

/**
 * Catalog fields the provider owns. Prices live here because they are the basis
 * for every booking total — the booking endpoint reads them from the record
 * rather than from the request body, so this is the only place they change.
 */
const catalogDetailsSchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().min(1).optional(),
  location: z.string().min(2).optional(),
  price: z.number().int().nonnegative().optional(),
  priceHome: z.number().int().nonnegative().nullable().optional(),
  specialty: z.string().min(2).max(80).optional(),
  description: z.string().max(600).optional(),
  consultationTypes: z.array(z.enum(['cabinet', 'home', 'hospital'])).min(1).optional(),
  phone: z.string().min(5).optional(),
})

providersRouter.put('/me/catalog', async (req: Request, res: Response) => {
  const parsed = catalogDetailsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const data = parsed.data
  const providerId = requireProviderId(req, res)
  if (!providerId) return
  const role = req.auth!.role
  const mapping = PROVIDER_TABLE[role]
  if (!mapping) {
    res.status(400).json({ error: 'Rôle professionnel inconnu' })
    return
  }

  const record = await loadProviderRecord(role, providerId)
  if (!record) {
    res.status(404).json({ error: 'Profil professionnel introuvable' })
    return
  }

  const sets: string[] = []
  const params: unknown[] = []
  const set = (column: string, value: unknown) => {
    params.push(value)
    sets.push(`${column} = $${params.length}`)
  }

  const nameCol = mapping.nameCol
  if (data.name !== undefined) set(nameCol, data.name)
  if (data.location !== undefined) set('location', data.location)
  if (data.city !== undefined) set('city', data.city)
  if (data.description !== undefined) set('description', data.description)
  if (data.phone !== undefined && 'phone' in record) set('phone', data.phone)

  // Price and specialty only exist on the roles that bill for consultations.
  if (data.price !== undefined && 'price' in record) set('price', data.price)
  if (data.specialty !== undefined && 'specialty' in record) set('specialty', data.specialty)
  if (data.consultationTypes !== undefined && 'consultation_types' in record) {
    set('consultation_types', JSON.stringify(data.consultationTypes))
  }
  if ('price_home' in record) {
    // Offering a home visit without a price for it would silently book at 0,
    // so default it to the cabinet price rather than accept a null.
    const offersHome = data.consultationTypes?.includes('home') ?? false
    if (data.priceHome !== undefined) {
      set('price_home', data.priceHome)
    } else if (offersHome && record.price_home == null) {
      set('price_home', data.price ?? Number(record.price ?? 0))
    }
  }

  if (sets.length === 0) {
    res.status(400).json({ error: 'Aucun champ à modifier' })
    return
  }

  params.push(providerId)
  await db.query(`UPDATE ${mapping.table} SET ${sets.join(', ')} WHERE id = $${params.length}`, params)

  const updated = await db.query(`SELECT * FROM ${mapping.table} WHERE id = $1`, [providerId])
  const userRow = (await db.query('SELECT * FROM users WHERE id = $1', [req.auth!.id])).rows[0] as UserRow
  res.json({ user: publicUser(userRow), provider: await fetchProfile(userRow.role, providerId), record: updated.rows[0] })
})
