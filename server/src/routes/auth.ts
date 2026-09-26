import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth, signToken } from '../auth.js'
import { rateLimit } from '../rateLimit.js'
import { isProviderRole, PROVIDER_ROLES, publicUser, uniqueId, type UserRow } from '../helpers.js'

export const authRouter = Router()

/**
 * bcrypt runs asynchronously throughout. The synchronous variants block the
 * event loop for the whole hash/compare, which on an unthrottled login endpoint
 * is a denial-of-service vector in its own right.
 */
const BCRYPT_ROUNDS = 10

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
})

const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 })
const providerRegisterLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 })
const passwordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.string().optional(),
})

authRouter.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload' })
    return
  }
  const { email, password } = parsed.data
  const row = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0] as UserRow | undefined
  // Compare against a dummy hash when the account does not exist so the
  // response time does not reveal which emails are registered.
  const hash = row?.password_hash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
  const ok = await bcrypt.compare(password, hash)
  if (!row || !ok) {
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
  password: z.string().min(6),
  role: z.string(),
  location: z.string().min(1),
})

authRouter.post('/register', registerLimiter, async (req, res) => {
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

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [data.email])
  if ((existing.rowCount ?? 0) > 0) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }

  const id = uniqueId('u')
  const hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
  await db.query(
    `INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, provider_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'patient', $7, NULL)`,
    [id, data.firstName, data.lastName, data.phone, data.email, hash, data.location],
  )
  const row = (await db.query('SELECT * FROM users WHERE id = $1', [id])).rows[0] as UserRow
  const user = publicUser(row)
  res.json({ token: signToken({ id: user.id, role: 'patient', providerId: null }), user })
})

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

/**
 * Uploaded documents are stored as base64 in `provider_documents.data` and
 * echoed back to admins in full, so they are validated rather than accepted as
 * an opaque blob. Previously any non-empty string of any mime up to the global
 * 6 MB body limit was stored.
 */
const ALLOWED_DOC_MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'] as const
/** Decoded size cap per document (~2 MB), checked before it reaches the database. */
const MAX_DOC_BYTES = 2 * 1024 * 1024

function base64ByteLength(value: string): number {
  const clean = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding)
}

const documentSchema = z
  .object({
    docType: z.enum(['license', 'diploma', 'id', 'certificate']),
    fileName: z.string().min(1).max(200),
    mime: z.enum(ALLOWED_DOC_MIME),
    data: z.string().min(1),
  })
  .superRefine((doc, ctx) => {
    // The payload must actually be base64 of the declared type, not an
    // arbitrary string smuggled through the `mime` field.
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(doc.data.replace(/^data:[^;]+;base64,/, ''))) {
      ctx.addIssue({ code: 'custom', path: ['data'], message: 'Document : contenu base64 invalide' })
    }
    if (base64ByteLength(doc.data) > MAX_DOC_BYTES) {
      ctx.addIssue({ code: 'custom', path: ['data'], message: 'Document : fichier trop volumineux' })
    }
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
  documents: z.array(documentSchema).min(1).max(3),
})

authRouter.post('/provider-register', providerRegisterLimiter, async (req, res) => {
  const parsed = providerRegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    res.status(400).json({ error: first?.message ?? 'Formulaire incomplet ou documents invalides' })
    return
  }
  const data = parsed.data
  const emailUser = await db.query('SELECT id FROM users WHERE email = $1', [data.email])
  if ((emailUser.rowCount ?? 0) > 0) {
    res.status(409).json({ error: 'Email déjà utilisé' })
    return
  }
  // Only a *pending* or approved application blocks a resubmission. A rejected
  // applicant is allowed to apply again — previously the check ignored status,
  // so one rejection locked that email out permanently.
  const duplicate = await db.query(
    `SELECT id FROM provider_applications WHERE email = $1 AND status IN ('pending', 'approved')`,
    [data.email],
  )
  if ((duplicate.rowCount ?? 0) > 0) {
    res.status(409).json({ error: 'Une demande est déjà en cours avec cet email' })
    return
  }
  const id = uniqueId('pa')
  const reference = `PA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const createdAt = new Date().toISOString()
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO provider_applications (id, reference, role, org_name, first_name, last_name, phone, email, location, city, license_number, password_hash, status, review_note, reviewed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', NULL, NULL, $13)`,
      [
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
        passwordHash,
        createdAt,
      ],
    )
    for (let i = 0; i < data.documents.length; i++) {
      const d = data.documents[i]
      await client.query(
        `INSERT INTO provider_documents (id, application_id, doc_type, file_name, mime, data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`${id}_doc_${i + 1}`, id, d.docType, d.fileName, d.mime, d.data],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  res.status(201).json({ applicationId: id, reference, status: 'pending' })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const row = (await db.query('SELECT * FROM users WHERE id = $1', [req.auth!.id])).rows[0] as UserRow | undefined
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
  photo: z.string().optional(),
})

const photoPattern = /^data:image\/(png|jpe?g|webp|gif);base64,/
const MAX_PHOTO_LENGTH = 3_000_000

authRouter.put('/me', requireAuth, async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body)
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
  const existingRow = (await db.query('SELECT * FROM users WHERE id = $1', [req.auth!.id])).rows[0] as UserRow | undefined
  if (!existingRow) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
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
  res.json({ user: publicUser(updated) })
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

authRouter.put('/me/password', requireAuth, passwordLimiter, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    return
  }
  const row = (await db.query('SELECT * FROM users WHERE id = $1', [req.auth!.id])).rows[0] as UserRow | undefined
  if (!row) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
  if (!(await bcrypt.compare(parsed.data.currentPassword, row.password_hash))) {
    res.status(400).json({ error: 'Mot de passe actuel incorrect' })
    return
  }
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS),
    req.auth!.id,
  ])
  res.json({ ok: true })
})