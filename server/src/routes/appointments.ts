import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, isProviderRole, uniqueId } from '../helpers.js'
import {
  CONSULT_TYPES,
  PROVIDER_TABLE,
  BOOKABLE_ROLES,
  basePriceFor,
  loadProviderRecord,
  locationFor,
  platformFeeFor,
} from '../catalog.js'

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
  consultationType: r.consultation_type ?? undefined,
  date: r.date,
  time: r.time,
  location: r.location,
  status: r.status,
  price: r.price,
  basePrice: r.base_price ?? undefined,
  paymentStatus: r.payment_status,
})

const BOOK_STATUSES = ['confirmed', 'pending'] as const
const MUTATION_STATUSES = ['confirmed', 'pending', 'completed', 'cancelled'] as const

/**
 * Provider-owned details are accepted so the client does not have to refetch,
 * but the stored values come from the catalog record — see `POST /`.
 * `price` and `paymentStatus` are deliberately not in this schema: a client
 * must not be able to name its own price or declare an appointment paid.
 */
const createSchema = z.object({
  providerId: z.string().min(1),
  providerType: z.string().min(1),
  providerName: z.string().optional(),
  providerPhoto: z.string().optional(),
  type: z.string().min(1),
  consultationType: z.enum(CONSULT_TYPES).optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().optional(),
  status: z.enum(BOOK_STATUSES).optional(),
})

appointmentsRouter.get('/', async (req: Request, res: Response) => {
  const auth = req.auth!
  const where: string[] = []
  const params: unknown[] = []
  if (auth.role === 'patient') {
    where.push('patient_id = ?')
    params.push(auth.id)
  } else if (auth.role === 'admin') {
    where.push('1 = 1')
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

  if (!isProviderRole(input.providerType)) {
    res.status(400).json({ error: 'Type de professionnel invalide' })
    return
  }
  // Organisations such as medical NGOs are listed in the directory but have no
  // consultation to schedule, so say that rather than failing later on a fee.
  if (!(BOOKABLE_ROLES as readonly string[]).includes(input.providerType)) {
    res.status(400).json({ error: 'Ce type de prestataire n’accepte pas de prise de rendez-vous' })
    return
  }

  // The catalog record is the source of truth for who this is, what it costs
  // and where it happens. Anything the client sent for those is ignored.
  const record = await loadProviderRecord(input.providerType, input.providerId)
  if (!record) {
    res.status(404).json({ error: 'Professionnel introuvable' })
    return
  }

  const basePrice = basePriceFor(record, input.consultationType)
  if (basePrice <= 0) {
    res.status(409).json({ error: "Ce professionnel n'a pas encore défini ses honoraires" })
    return
  }
  const total = basePrice + platformFeeFor(basePrice)

  // Each role's display name lives in a different column (`provider` for
  // ambulances), so read it through the role mapping rather than hardcoding.
  const nameCol = PROVIDER_TABLE[input.providerType]!.nameCol
  const providerName = String(record[nameCol] ?? '')
  const patientRow = (await db.query('SELECT location FROM users WHERE id = ?', [req.auth!.id])).rows[0] as
    | { location: string | null }
    | undefined

  const appointment = {
    id: uniqueId('ap'),
    reference: generateReference('MS'),
    patientId: req.auth!.id,
    providerId: input.providerId,
    providerType: input.providerType,
    providerName,
    providerPhoto: (record.photo as string | null) ?? null,
    type: input.type,
    consultationType: input.consultationType ?? null,
    date: input.date,
    time: input.time,
    location: locationFor(record, input.consultationType, patientRow?.location ?? null),
    status: input.status ?? 'confirmed',
    price: total,
    basePrice,
    // Always starts unpaid: `POST /payments` is what flips it to 'paid'.
    paymentStatus: 'unpaid',
  }
  await db.query(
    `INSERT INTO appointments (id, reference, patient_id, provider_id, provider_type, provider_name, provider_photo, type, consultation_type, date, time, location, status, price, base_price, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      appointment.id,
      appointment.reference,
      appointment.patientId,
      appointment.providerId,
      appointment.providerType,
      appointment.providerName,
      appointment.providerPhoto,
      appointment.type,
      appointment.consultationType,
      appointment.date,
      appointment.time,
      appointment.location,
      appointment.status,
      appointment.price,
      appointment.basePrice,
      appointment.paymentStatus,
    ],
  )
  res.status(201).json(mapAppointment({ ...appointment, provider_photo: appointment.providerPhoto }))
})

/**
 * Allowed status moves, by who is asking.
 *
 * A patient may only withdraw their own booking — previously any authenticated
 * patient could PATCH their appointment to 'completed' or 'confirmed'.
 * 'completed' and 'cancelled' are terminal.
 */
const PROVIDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}
const PATIENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['cancelled'],
  confirmed: ['cancelled'],
  completed: [],
  cancelled: [],
}

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
  const next = parsed.data.status
  const current = String(row.status)

  if (auth.role === 'patient') {
    if (row.patient_id !== auth.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  } else if (auth.role === 'admin') {
    // Admins moderate any appointment.
  } else if (row.provider_id !== auth.providerId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const allowed = auth.role === 'patient' ? PATIENT_TRANSITIONS : PROVIDER_TRANSITIONS
  if (!(allowed[current] ?? []).includes(next)) {
    res.status(409).json({ error: `Transition ${current} → ${next} non autorisée` })
    return
  }

  await db.query('UPDATE appointments SET status = ? WHERE id = ?', [next, req.params.id])
  const updated = (await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id])).rows[0] as Row
  res.json(mapAppointment(updated))
})