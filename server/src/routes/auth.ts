import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, signToken } from '../auth.js'
import { isProviderRole, PROVIDER_ROLES, publicUser, type UserRow } from '../helpers.js'

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
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.string(),
  location: z.string().min(1),
})

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const data = parsed.data

  if (isProviderRole(data.role)) {
    res.status(400).json({ error: 'Les professionnels doivent soumettre une demande via le formulaire dédié' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email)
  if (existing) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }

  const id = `u_${Date.now()}`
  const hash = bcrypt.hashSync(data.password, 10)
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, provider_id)
    VALUES (?, ?, ?, ?, ?, ?, 'patient', ?, NULL)
  `).run(id, data.firstName, data.lastName, data.phone, data.email, hash, data.location)
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
  const user = publicUser(row)
  res.json({ token: signToken({ id: user.id, role: 'patient', providerId: null }), user })
})

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

const providerRegisterSchema = z.object({
  role: z.enum(PROVIDER_ROLES),
  orgName: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email(),
  location: z.string().min(2),
  city: z.string().min(1),
  licenseNumber: z.string().min(3),
  password: z.string().min(6),
  documents: z
    .array(
      z.object({
        docType: z.string().min(1),
        fileName: z.string().min(1),
        mime: z.string().min(1),
        data: z.string().min(1),
      }),
    )
    .min(1)
    .max(3),
})

authRouter.post('/provider-register', (req, res) => {
  const parsed = providerRegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Formulaire incomplet ou documents manquants' })
    return
  }
  const data = parsed.data
  const emailUser = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email)
  if (emailUser) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }
  const duplicate = db.prepare('SELECT id FROM provider_applications WHERE email = ?').get(data.email)
  if (duplicate) {
    res.status(409).json({ error: 'Une demande a déjà été soumise avec cet email' })
    return
  }
  const id = `pa_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const reference = `PA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const createdAt = new Date().toISOString()
  const apply = db.transaction(() => {
    db.prepare(`
      INSERT INTO provider_applications (id, reference, role, org_name, first_name, last_name, phone, email, location, city, license_number, password_hash, status, review_note, reviewed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?)
    `).run(
      id,
      reference,
      data.role,
      data.orgName,
      data.firstName,
      data.lastName,
      data.phone,
      data.email,
      data.location,
      data.city,
      data.licenseNumber,
      bcrypt.hashSync(data.password, 10),
      createdAt,
    )
    const docStmt = db.prepare(`
      INSERT INTO provider_documents (id, application_id, doc_type, file_name, mime, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    data.documents.forEach((d, i) => {
      docStmt.run(`${id}_doc_${i + 1}`, id, d.docType, d.fileName, d.mime, d.data)
    })
  })
  apply()
  res.status(201).json({ applicationId: id, reference, status: 'pending' })
})

authRouter.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as UserRow | undefined
  if (!row) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
  res.json({ user: publicUser(row) })
})

const updateMeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  location: z.string().optional(),
})

authRouter.put('/me', requireAuth, (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const data = parsed.data
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.id) as UserRow | undefined
  if (!existing) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
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
  res.json({ user: publicUser(updated) })
})