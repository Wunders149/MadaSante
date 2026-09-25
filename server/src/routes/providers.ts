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

function fetchProfile(role: string, providerId: string | null) {
  if (!providerId) return undefined
  const mapping = TABLE_BY_ROLE[role]
  if (!mapping) return undefined
  const row = db.prepare(`SELECT * FROM ${mapping.table} WHERE id = ?`).get(providerId) as Row | undefined
  if (!row) return undefined
  return { id: row.id, name: row[mapping.nameCol], location: row.location, city: row.city }
}

providersRouter.get('/me', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as UserRow
  const user = publicUser(row)
  res.json({ user, provider: fetchProfile(user.role, user.providerId ?? null) })
})

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
})

providersRouter.put('/me', (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const data = parsed.data
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as UserRow
  const next = {
    firstName: data.firstName ?? existing.first_name,
    lastName: data.lastName ?? existing.last_name,
    phone: data.phone ?? existing.phone,
    email: data.email ?? existing.email,
    location: data.location ?? existing.location ?? '',
  }
  if (next.email !== existing.email) {
    const clash = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(next.email, req.auth!.id)
    if (clash) {
      res.status(409).json({ error: 'Email déjà utilisé' })
      return
    }
  }
  db.prepare(`
    UPDATE users SET first_name = ?, last_name = ?, phone = ?, email = ?, location = ?
    WHERE id = ?
  `).run(next.firstName, next.lastName, next.phone, next.email, next.location, req.auth!.id)
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as UserRow
  const user = publicUser(updated)
  res.json({ user, provider: fetchProfile(user.role, user.providerId ?? null) })
})

providersRouter.get('/me/availability', (req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT day, slot, available FROM availability WHERE provider_id = ? ORDER BY day, slot')
    .all(req.auth!.providerId) as Row[]
  res.json(rows.map((r) => ({ day: r.day, slot: r.slot, available: r.available === 1 })))
})

const availabilitySchema = z.object({
  entries: z.array(z.object({ day: z.string(), slot: z.string(), available: z.boolean() })).max(200),
})

providersRouter.put('/me/availability', (req: Request, res: Response) => {
  const parsed = availabilitySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const providerId = req.auth!.providerId
  const sync = db.transaction(() => {
    db.prepare('DELETE FROM availability WHERE provider_id = ?').run(providerId)
    const stmt = db.prepare(
      'INSERT INTO availability (provider_id, day, slot, available) VALUES (?, ?, ?, ?)',
    )
    for (const e of parsed.data.entries) stmt.run(providerId, e.day, e.slot, e.available ? 1 : 0)
  })
  sync()
  res.json({ ok: true })
})