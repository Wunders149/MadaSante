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

adminRouter.get('/applications', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const rows = db
    .prepare(
      `SELECT ${APP_COLUMNS},
        (SELECT COUNT(*) FROM provider_documents d WHERE d.application_id = p.id) AS doc_count
       FROM provider_applications p
       ${status ? 'WHERE status = ?' : ''}
       ORDER BY created_at DESC`,
    )
    .all(...(status ? [status] : [])) as Array<AppRow & { doc_count: number }>
  res.json(rows.map((r) => ({ ...mapApp(r), documentCount: r.doc_count })))
})

adminRouter.get('/applications/:id', (req, res) => {
  const row = db
    .prepare(`SELECT ${APP_COLUMNS} FROM provider_applications p WHERE id = ?`)
    .get(req.params.id) as AppRow | undefined
  if (!row) {
    res.status(404).json({ error: 'Demande introuvable' })
    return
  }
  const docs = db
    .prepare('SELECT id, doc_type, file_name, mime, data FROM provider_documents WHERE application_id = ?')
    .all(row.id) as DocRow[]
  res.json({ application: { ...mapApp(row), documents: docs.map(mapDoc) } })
})

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
})

adminRouter.patch('/applications/:id', (req, res) => {
  const parsed = reviewSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Statut invalide' })
    return
  }
  const { status, note } = parsed.data
  const row = db
    .prepare(`SELECT ${APP_COLUMNS} FROM provider_applications p WHERE id = ?`)
    .get(req.params.id) as AppRow | undefined
  if (!row) {
    res.status(404).json({ error: 'Demande introuvable' })
    return
  }
  if (row.status !== 'pending') {
    res.status(409).json({ error: 'Cette demande a déjà été traitée' })
    return
  }
  const reviewedAt = new Date().toISOString()
  const review = db.transaction(() => {
    if (status === 'approved') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(row.email)
      if (existing) {
        return { error: 'Email déjà utilisé' }
      }
      db.prepare(`
        INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, photo, provider_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
      `).run(
        `u_${row.id}`,
        row.first_name,
        row.last_name,
        row.phone,
        row.email,
        row.password_hash,
        row.role,
        row.location,
      )
    }
    db.prepare("UPDATE provider_applications SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?").run(
      status,
      note ?? row.review_note ?? null,
      reviewedAt,
      row.id,
    )
    return null
  })()
  if (review) {
    res.status(409).json({ error: review.error })
    return
  }
  const updated = db
    .prepare(`SELECT ${APP_COLUMNS} FROM provider_applications p WHERE id = ?`)
    .get(row.id) as AppRow
  res.json({ application: mapApp(updated) })
})