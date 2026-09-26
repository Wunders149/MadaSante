import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAdmin, requireAuth } from '../auth.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireAdmin)

type AppRow = {
  id: string
  reference: string
  role: string
  org_name: string
  first_name: string
  last_name: string
  phone: string
  email: string
  location: string
  city: string
  license_number: string
  password_hash: string
  status: string
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

type DocRow = {
  id: string
  doc_type: string
  file_name: string
  mime: string
  data: string
}

const APP_COLUMNS =
  'id, reference, role, org_name, first_name, last_name, phone, email, location, city, license_number, password_hash, status, review_note, reviewed_at, created_at'

function mapApp(row: AppRow) {
  return {
    id: row.id,
    reference: row.reference,
    role: row.role,
    orgName: row.org_name,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    location: row.location,
    city: row.city,
    licenseNumber: row.license_number,
    status: row.status,
    reviewNote: row.review_note ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
  }
}

function mapDoc(row: DocRow) {
  return {
    id: row.id,
    docType: row.doc_type,
    fileName: row.file_name,
    mime: row.mime,
    data: row.data,
  }
}

adminRouter.get('/applications', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const rows = (
    await db.query(
      `SELECT ${APP_COLUMNS},
        (SELECT COUNT(*) FROM provider_documents d WHERE d.application_id = p.id) AS doc_count
       FROM provider_applications p
       ${status ? 'WHERE status = ?' : ''}
       ORDER BY created_at DESC`,
      status ? [status] : [],
    )
  ).rows as unknown as Array<AppRow & { doc_count: number }>
  res.json(rows.map((r) => ({ ...mapApp(r), documentCount: Number(r.doc_count) })))
})

adminRouter.get('/applications/:id', async (req, res) => {
  const row = (
    await db.query(`SELECT ${APP_COLUMNS} FROM provider_applications p WHERE id = ?`, [req.params.id])
  ).rows[0] as AppRow | undefined
  if (!row) {
    res.status(404).json({ error: 'Demande introuvable' })
    return
  }
  const docs = (
    await db.query('SELECT id, doc_type, file_name, mime, data FROM provider_documents WHERE application_id = ?', [
      row.id,
    ])
  ).rows as DocRow[]
  res.json({ application: { ...mapApp(row), documents: docs.map(mapDoc) } })
})

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
})

adminRouter.patch('/applications/:id', async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Statut invalide' })
    return
  }
  const { status, note } = parsed.data
  const row = (
    await db.query(`SELECT ${APP_COLUMNS} FROM provider_applications p WHERE id = ?`, [req.params.id])
  ).rows[0] as AppRow | undefined
  if (!row) {
    res.status(404).json({ error: 'Demande introuvable' })
    return
  }
  if (row.status !== 'pending') {
    res.status(409).json({ error: 'Cette demande a déjà été traitée' })
    return
  }
  const reviewedAt = new Date().toISOString()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    if (status === 'approved') {
      const existing = await client.query('SELECT id FROM users WHERE email = ?', [row.email])
      if ((existing.rowCount ?? 0) > 0) {
        await client.query('ROLLBACK')
        res.status(409).json({ error: 'Email déjà utilisé' })
        return
      }
      await client.query(
        `INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, photo, provider_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
        [
          `u_${row.id}`,
          row.first_name,
          row.last_name,
          row.phone,
          row.email,
          row.password_hash,
          row.role,
          row.location,
        ],
      )
    }
    await client.query('UPDATE provider_applications SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?', [
      status,
      note ?? row.review_note ?? null,
      reviewedAt,
      row.id,
    ])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  const updated = (
    await db.query(`SELECT ${APP_COLUMNS} FROM provider_applications p WHERE id = ?`, [row.id])
  ).rows[0] as AppRow
  res.json({ application: mapApp(updated) })
})