import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference } from '../helpers.js'

export const appointmentsRouter = Router()
appointmentsRouter.use(requireAuth)

type Row = Record<string, unknown>

const mapAppointment = (r: Row) => ({
  id: r.id,
  reference: r.reference,
  patientId: r.patient_id,
  providerId: r.provider_id,
  providerType: r.provider_type,
  providerName: r.provider_name,
  providerPhoto: r.provider_photo ?? undefined,
  type: r.type,
  date: r.date,
  time: r.time,
  location: r.location,
  status: r.status,
  price: r.price,
  paymentStatus: r.payment_status,
})

const BOOK_STATUSES = ['confirmed', 'pending'] as const
const MUTATION_STATUSES = ['confirmed', 'pending', 'completed', 'cancelled'] as const

const createSchema = z.object({
  providerId: z.string(),
  providerType: z.string(),
  providerName: z.string(),
  providerPhoto: z.string().optional(),
  type: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  price: z.number(),
  status: z.enum(BOOK_STATUSES).optional(),
  paymentStatus: z.enum(['paid', 'pending', 'unpaid']).optional(),
})

appointmentsRouter.get('/', async (req: Request, res: Response) => {
  const auth = req.auth!
  const where: string[] = []
  const params: unknown[] = []
  if (auth.role === 'patient') {
    where.push('patient_id = ?')
    params.push(auth.id)
  } else if (auth.providerId) {
    where.push('provider_id = ?')
    params.push(auth.providerId)
  } else {
    res.json([])
    return
  }
  const status = String(req.query.status ?? '')
  if (status) {
    where.push('status = ?')
    params.push(status)
  }
  const rows = (
    await db.query(`SELECT * FROM appointments WHERE ${where.join(' AND ')} ORDER BY date DESC, time DESC`, params)
  ).rows as Row[]
  res.json(rows.map(mapAppointment))
})

appointmentsRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const input = parsed.data
  const appointment = {
    id: `ap-${Date.now()}`,
    reference: generateReference('MS'),
    patientId: req.auth!.id,
    providerId: input.providerId,
    providerType: input.providerType,
    providerName: input.providerName,
    providerPhoto: input.providerPhoto ?? null,
    type: input.type,
    date: input.date,
    time: input.time,
    location: input.location,
    status: input.status ?? 'confirmed',
    price: input.price,
    paymentStatus: input.paymentStatus ?? 'unpaid',
  }
  await db.query(
    `INSERT INTO appointments (id, reference, patient_id, provider_id, provider_type, provider_name, provider_photo, type, date, time, location, status, price, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      appointment.id,
      appointment.reference,
      appointment.patientId,
      appointment.providerId,
      appointment.providerType,
      appointment.providerName,
      appointment.providerPhoto,
      appointment.type,
      appointment.date,
      appointment.time,
      appointment.location,
      appointment.status,
      appointment.price,
      appointment.paymentStatus,
    ],
  )
  res.status(201).json(mapAppointment({ ...appointment, provider_photo: appointment.providerPhoto }))
})

appointmentsRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const auth = req.auth!
  const parsed = z.object({ status: z.enum(MUTATION_STATUSES) }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Statut invalide' })
    return
  }
  const row = (await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id])).rows[0] as Row | undefined
  if (!row) {
    res.status(404).json({ error: 'Rendez-vous introuvable' })
    return
  }
  if (auth.role !== 'patient' && row.provider_id !== auth.providerId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  if (auth.role === 'patient' && row.patient_id !== auth.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  await db.query('UPDATE appointments SET status = ? WHERE id = ?', [parsed.data.status, req.params.id])
  const updated = (await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id])).rows[0] as Row
  res.json(mapAppointment(updated))
})