import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, signToken } from '../auth.js'
import { isProviderRole, publicUser, type UserRow } from '../helpers.js'
import { providerUsers } from '../seed-data.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.string().optional(),
})

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload' })
    return
  }
  const { email, password } = parsed.data
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: 'Identifiants invalides' })
    return
  }
  const user = publicUser(row)
  res.json({ token: signToken({ id: user.id, role: user.role, providerId: user.providerId ?? null }), user })
})

const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(4).optional(),
  role: z.string(),
  location: z.string().optional(),
})

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const data = parsed.data

  if (isProviderRole(data.role)) {
    const seed = providerUsers.find((p) => p.role === data.role) ?? providerUsers[0]
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(seed.id) as UserRow
    const user = publicUser(row)
    res.json({ token: signToken({ id: user.id, role: user.role, providerId: user.providerId ?? null }), user })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email)
  if (existing) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }

  const id = `u_${Date.now()}`
  const hash = bcrypt.hashSync(data.password ?? 'demo', 10)
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, provider_id)
    VALUES (?, ?, ?, ?, ?, ?, 'patient', ?, NULL)
  `).run(
    id,
    data.firstName ?? 'Nouveau',
    data.lastName ?? 'Patient',
    data.phone ?? '+261 34 00 000 00',
    data.email ?? 'patient@demo.mg',
    hash,
    data.location ?? 'Antananarivo',
  )
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
  const user = publicUser(row)
  res.json({ token: signToken({ id: user.id, role: 'patient', providerId: null }), user })
})

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as UserRow | undefined
  if (!row) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
  res.json({ user: publicUser(row) })
})