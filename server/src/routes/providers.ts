import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, requireProvider } from '../auth.js'
import { publicUser, type UserRow } from '../helpers.js'

export const providersRouter = Router()
providersRouter.use(requireAuth, requireProvider)

type Row = Record<string, unknown>

const TABLE_BY_ROLE: Record<string, { table: string; nameCol: string }> = {
  doctor: { table: 'doctors', nameCol: 'name' },
  nurse: { table: 'nurses', nameCol: 'name' },
  pharmacy: { table: 'pharmacies', nameCol: 'name' },
  laboratory: { table: 'laboratories', nameCol: 'name' },
  imaging_center: { table: 'imaging_centers', nameCol: 'name' },
  hospital: { table: 'hospitals', nameCol: 'name' },
  ambulance_driver: { table: 'ambulances', nameCol: 'provider' },
}

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

providersRouter.get('/me/availability', async (req: Request, res: Response) => {
  const rows = (
    await db.query('SELECT day, slot, available FROM availability WHERE provider_id = $1 ORDER BY day, slot', [
      req.auth!.providerId,
    ])
  ).rows as Row[]
  res.json(rows.map((r) => ({ day: r.day, slot: r.slot, available: r.available === 1 })))
})

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