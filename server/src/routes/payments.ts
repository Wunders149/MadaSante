import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, todayIso, uniqueId } from '../helpers.js'

export const paymentsRouter = Router()
paymentsRouter.use(requireAuth)

type Row = Record<string, unknown>

const mapPayment = (r: Row) => ({
  id: r.id,
  reference: r.reference,
  patientId: r.patient_id,
  providerId: r.provider_id ?? undefined,
  appointmentId: r.appointment_id ?? undefined,
  service: r.service,
  providerName: r.provider_name,
  date: r.date,
  amount: r.amount,
  method: r.method,
  status: r.status,
  breakdown: JSON.parse(r.breakdown as string) as { label: string; amount: number }[],
})

/**
 * A payment settles a specific appointment. The amount, service and provider
 * are all read from that appointment rather than the body, so a client cannot
 * invent a price — and so paying actually reconciles the appointment, which
 * previously stayed 'unpaid' forever because nothing ever updated it.
 */
const createSchema = z.object({
  appointmentId: z.string().min(1),
  method: z.enum(['orange_money', 'mvola']),
})

paymentsRouter.get('/', async (req: Request, res: Response) => {
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
  const method = String(req.query.method ?? '')
  if (method === 'orange_money' || method === 'mvola') {
    where.push('method = ?')
    params.push(method)
  }
  const rows = (
    await db.query(`SELECT * FROM payments WHERE ${where.join(' AND ')} ORDER BY date DESC`, params)
  ).rows as Row[]
  res.json(rows.map(mapPayment))
})

paymentsRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const { appointmentId, method } = parsed.data

  const appointment = (await db.query('SELECT * FROM appointments WHERE id = ?', [appointmentId])).rows[0] as
    | Row
    | undefined
  if (!appointment) {
    res.status(404).json({ error: 'Rendez-vous introuvable' })
    return
  }
  if (appointment.patient_id !== req.auth!.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  if (appointment.status === 'cancelled') {
    res.status(409).json({ error: 'Ce rendez-vous a été annulé' })
    return
  }
  if (appointment.payment_status === 'paid') {
    res.status(409).json({ error: 'Ce rendez-vous est déjà payé' })
    return
  }

  const amount = Number(appointment.price)
  const basePrice = Number(appointment.base_price ?? amount)
  const fee = amount - basePrice
  const breakdown = [
    { label: String(appointment.type), amount: basePrice },
    ...(fee > 0 ? [{ label: 'Frais de plateforme', amount: fee }] : []),
  ]

  const payment = {
    id: uniqueId('pay'),
    reference: generateReference('PAY'),
    patientId: req.auth!.id,
    providerId: appointment.provider_id ?? null,
    appointmentId,
    service: String(appointment.type),
    providerName: String(appointment.provider_name),
    date: todayIso(),
    amount,
    method,
    status: 'success',
    breakdown,
  }

  // Insert the payment and flip the appointment in one transaction so a
  // successful charge can never leave the appointment marked unpaid.
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO payments (id, reference, patient_id, provider_id, appointment_id, service, provider_name, date, amount, method, status, breakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment.id,
        payment.reference,
        payment.patientId,
        payment.providerId,
        payment.appointmentId,
        payment.service,
        payment.providerName,
        payment.date,
        payment.amount,
        payment.method,
        payment.status,
        JSON.stringify(payment.breakdown),
      ],
    )
    await client.query('UPDATE appointments SET payment_status = ? WHERE id = ?', ['paid', appointmentId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  // Re-read the stored row: mapPayment reads snake_case columns, so mapping the
  // camelCase literal dropped appointmentId from the response.
  const stored = (await db.query('SELECT * FROM payments WHERE id = $1', [payment.id])).rows[0] as Row
  res.status(201).json(mapPayment(stored))
})

paymentsRouter.get('/summary', async (req: Request, res: Response) => {
  const auth = req.auth!
  if (auth.role === 'patient' || !auth.providerId) {
    res.json({ total: 0, count: 0 })
    return
  }
  const row = (
    await db.query(
      `SELECT COALESCE(SUM(amount), 0)::int AS total, COUNT(*)::int AS count
       FROM payments WHERE provider_id = ? AND status = 'success'`,
      [auth.providerId],
    )
  ).rows[0] as { total: number; count: number }
  res.json({ total: row.total, count: row.count })
})