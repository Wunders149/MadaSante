import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireProvider } from '../auth.js'
import { publicUser, type UserRow } from '../helpers.js'

export const providersRouter = Router()
// Public, unauthenticated route: catalog of providers for patients to browse.
export const providersRouterPublic = Router()

const TABLE_BY_ROLE: Record<string, { table: string; nameCol: string }> = {
  doctor: { table: 'doctors', nameCol: 'name' },
  nurse: { table: 'nurses', nameCol: 'name' },
  pharmacy: { table: 'pharmacies', nameCol: 'name' },
  laboratory: { table: 'laboratories', nameCol: 'name' },
  imaging_center: { table: 'imaging_centers', nameCol: 'name' },
  hospital: { table: 'hospitals', nameCol: 'name' },
  ambulance_driver: { table: 'ambulances', nameCol: 'provider' },
}

type Row = Record<string, unknown>

async function fetchProfile(role: string, providerId: string | null) {
  if (!providerId) return undefined
  const mapping = TABLE_BY_ROLE[role]
  if (!mapping) return undefined
  const row = (await db.query(`SELECT * FROM ${mapping.table} WHERE id = $1`, [providerId])).rows[0] as Row | undefined
  if (!row) return undefined
  return { id: row.id, name: row[mapping.nameCol], location: row.location, city: row.city }
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
providersRouterPublic.get('/', async (req: Request, res: Response) => {
  const role = typeof req.query.role === 'string' ? req.query.role : undefined
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)))
  const offset = (page - 1) * limit
  const where: string[] = []
  const params: unknown[] = []
  if (role && role in TABLE_BY_ROLE) {
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
  params.push(offset, limit)
  const rows = (
    await db.query(
      `SELECT id, role, name, location, city, photo, rating, description
       FROM (
         SELECT id, 'doctor' AS role, name, location, city, photo, rating, description FROM doctors
         UNION ALL SELECT id, 'nurse' AS role, name, location, city, photo, rating, description FROM nurses
         UNION ALL SELECT id, 'pharmacy' AS role, name, location, city, NULL AS photo, rating, NULL AS description FROM pharmacies
         UNION ALL SELECT id, 'laboratory' AS role, name, location, city, NULL AS photo, rating, NULL AS description FROM laboratories
         UNION ALL SELECT id, 'imaging_center' AS role, name, location, city, NULL AS photo, rating, NULL AS description FROM imaging_centers
         UNION ALL SELECT id, 'hospital' AS role, name, location, city, NULL AS photo, rating, description FROM hospitals
         UNION ALL SELECT id, 'ambulance_driver' AS role, provider AS name, location, city, NULL AS photo, rating, NULL AS description FROM ambulances
       ) rolesn       WHERE ${where.length ? 'TRUE' : '1=0'}`,
      params,
    )
  ).rows as Row[]

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

  const totalRows = (
    await db.query(
      `SELECT COUNT(*)::int AS total FROM (
         SELECT id FROM doctorsn         UNION ALL SELECT id FROM nursesn         UNION ALL SELECT id FROM pharmaciesn         UNION ALL SELECT id FROM laboratoriesn         UNION ALL SELECT id FROM imaging_centersn         UNION ALL SELECT id FROM hospitalsn         UNION ALL SELECT provider AS id FROM ambulancesn       ) p ${where.length ? 'WHERE ' : ''}` + where.join(' AND '),
      params.slice(0, params.length - 2),
    )
  ).rows[0] as { total: number }

  res.json({
    providers,
    page,
    limit,
    total: Number(totalRows.total),
    totalPages: Math.ceil(Number(totalRows.total) / limit),
  })
})

providersRouter.use(requireAuth, requireProvider)

const availabilitySchema = z.object({
  entries: z.array(z.object({ day: z.string(), slot: z.string(), available: z.boolean() })).max(200),
})

providersRouter.put('/me/availability', async (req: Request, res: Response) => {
  const parsed = availabilitySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const providerId = req.auth!.providerId
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