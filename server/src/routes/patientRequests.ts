import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, todayIso, uniqueId } from '../helpers.js'
import { emitToProviders, emitToUser } from '../realtime.js'

export const patientRequestsRouter = Router()
patientRequestsRouter.use(requireAuth)

type Row = Record<string, unknown>

/**
 * "Trouver ce médicament": a patient reports a medicine they cannot find;
 * pharmacies see these and can confirm/decline. This is the orienting flow the
 * product vision requires where a search for a medication comes up empty.
 */
const medicationCreateSchema = z.object({
  medicineName: z.string().min(2).max(120),
  quantity: z.number().int().min(1).max(99).optional(),
  note: z.string().max(500).optional(),
})

const mapMedicationRequest = (r: Row) => ({
  id: r.id,
  reference: r.reference,
  patientId: r.patient_id,
  patientName: r.patient_name,
  medicineName: r.medicine_name,
  quantity: r.quantity,
  note: r.note,
  status: r.status,
  date: r.date,
})

patientRequestsRouter.post('/medication-requests', async (req: Request, res: Response) => {
  const parsed = medicationCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const account = (await db.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.auth!.id])).rows[0] as
    | { first_name: string; last_name: string }
    | undefined
  if (!account) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
  const id = uniqueId('medreq')
  const reference = generateReference('MED')
  await db.query(
    `INSERT INTO medication_requests (id, reference, patient_id, patient_name, medicine_name, quantity, note, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      id,
      reference,
      req.auth!.id,
      `${account.first_name} ${account.last_name}`.trim(),
      parsed.data.medicineName.trim(),
      parsed.data.quantity ?? 1,
      parsed.data.note ?? '',
      todayIso(),
    ],
  )
  emitToProviders('request.created', { type: 'medication', id, reference })
  const stored = (await db.query('SELECT * FROM medication_requests WHERE id = $1', [id])).rows[0] as Row
  res.status(201).json(mapMedicationRequest(stored))
})

patientRequestsRouter.get('/medication-requests', async (req: Request, res: Response) => {
  const auth = req.auth!
  if (auth.role === 'patient') {
    const rows = (
      await db.query('SELECT * FROM medication_requests WHERE patient_id = ? ORDER BY date DESC', [auth.id])
    ).rows as Row[]
    res.json(rows.map(mapMedicationRequest))
    return
  }
  // Pharmacies and admins triage all open requests.
  const rows = (await db.query(`SELECT * FROM medication_requests ORDER BY date DESC`)).rows as Row[]
  res.json(rows.map(mapMedicationRequest))
})

patientRequestsRouter.patch('/medication-requests/:id', async (req: Request, res: Response) => {
  const parsed = z.object({ status: z.enum(['pending', 'available', 'unavailable', 'closed']) }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Statut invalide' })
    return
  }
  if (req.auth!.role !== 'pharmacy' && req.auth!.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const row = (await db.query('SELECT * FROM medication_requests WHERE id = ?', [req.params.id])).rows[0] as Row | undefined
  if (!row) {
    res.status(404).json({ error: 'Demande introuvable' })
    return
  }
  await db.query('UPDATE medication_requests SET status = ? WHERE id = ?', [parsed.data.status, row.id])
  emitToUser(String(row.patient_id), 'notification.created', {
    title: 'Demande de médicament',
    message: `Votre demande ${row.reference} est maintenant : ${parsed.data.status}`,
  })
  const updated = (await db.query('SELECT * FROM medication_requests WHERE id = $1', [row.id])).rows[0] as Row
  res.json(mapMedicationRequest(updated))
})

/**
 * "Soins à domicile": the patient requests a professional to come to them with
 * address, reason, preferred time and urgency. Available providers accept to
 * match it.
 */
const homeCreateSchema = z.object({
  service: z.string().min(2).max(120),
  address: z.string().min(3).max(300),
  reason: z.string().min(2).max(500),
  preferredTime: z.string().min(1).max(120),
  urgency: z.enum(['normal', 'urgence']).optional(),
  location: z.string().max(120).optional(),
})

const mapHomeRequest = (r: Row) => ({
  id: r.id,
  reference: r.reference,
  patientId: r.patient_id,
  patientName: r.patient_name,
  phone: r.phone,
  service: r.service,
  address: r.address,
  reason: r.reason,
  preferredTime: r.preferred_time,
  urgency: r.urgency,
  location: r.location,
  providerId: r.provider_id ?? undefined,
  providerName: r.provider_name ?? undefined,
  status: r.status,
  date: r.date,
})

patientRequestsRouter.post('/home-requests', async (req: Request, res: Response) => {
  const parsed = homeCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const account = (await db.query('SELECT first_name, last_name, phone FROM users WHERE id = $1', [req.auth!.id])).rows[0] as
    | { first_name: string; last_name: string; phone: string }
    | undefined
  if (!account) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
  const id = uniqueId('homereq')
  const reference = generateReference('DOM')
  await db.query(
    `INSERT INTO home_requests (id, reference, patient_id, patient_name, phone, service, address, reason, preferred_time, urgency, location, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)`,
    [
      id,
      reference,
      req.auth!.id,
      `${account.first_name} ${account.last_name}`.trim(),
      account.phone,
      parsed.data.service,
      parsed.data.address,
      parsed.data.reason,
      parsed.data.preferredTime,
      parsed.data.urgency ?? 'normal',
      parsed.data.location ?? '',
      todayIso(),
    ],
  )
  emitToProviders('request.created', { type: 'home', id, reference })
  const stored = (await db.query('SELECT * FROM home_requests WHERE id = $1', [id])).rows[0] as Row
  res.status(201).json(mapHomeRequest(stored))
})

patientRequestsRouter.get('/home-requests', async (req: Request, res: Response) => {
  const auth = req.auth!
  if (auth.role === 'patient') {
    const rows = (
      await db.query('SELECT * FROM home_requests WHERE patient_id = ? ORDER BY date DESC', [auth.id])
    ).rows as Row[]
    res.json(rows.map(mapHomeRequest))
    return
  }
  // Professionals (nurses, doctors, MG allied-health) see open requests to accept.
  const rows = (await db.query(`SELECT * FROM home_requests WHERE status IN ('received','accepted','in_progress') ORDER BY date DESC`)).rows as Row[]
  res.json(rows.map(mapHomeRequest))
})

patientRequestsRouter.patch('/home-requests/:id', async (req: Request, res: Response) => {
  const parsed = z
    .object({ status: z.enum(['received', 'accepted', 'in_progress', 'completed', 'cancelled']), providerName: z.string().optional() })
    .safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Statut invalide' })
    return
  }
  const row = (await db.query('SELECT * FROM home_requests WHERE id = ?', [req.params.id])).rows[0] as Row | undefined
  if (!row) {
    res.status(404).json({ error: 'Demande introuvable' })
    return
  }
  const auth = req.auth!
  if (auth.role === 'patient') {
    // Patients may only cancel their own request.
    if (String(row.patient_id) !== auth.id || parsed.data.status !== 'cancelled') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    await db.query(`UPDATE home_requests SET status = 'cancelled' WHERE id = $1`, [row.id])
  } else {
    if (!isHomeProviderRole(auth.role)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    await db.query(`UPDATE home_requests SET status = ?, provider_id = ?, provider_name = ? WHERE id = ?`, [
      parsed.data.status,
      auth.providerId ?? row.provider_id,
      parsed.data.providerName ?? null,
      row.id,
    ])
  }
  emitToUser(String(row.patient_id), 'notification.created', {
    title: 'Soins à domicile',
    message: `Demande ${row.reference} : ${parsed.data.status}`,
  })
  const updated = (await db.query('SELECT * FROM home_requests WHERE id = $1', [row.id])).rows[0] as Row
  res.json(mapHomeRequest(updated))
})

function isHomeProviderRole(role: string): boolean {
  return (
    role === 'nurse' ||
    role === 'doctor' ||
    ['psychologist', 'psychiatrist', 'kinesitherapist', 'ergotherapist', 'speech_therapist', 'dietitian', 'midwife'].includes(role)
  )
}
