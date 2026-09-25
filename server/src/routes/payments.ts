import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, todayIso } from '../helpers.js'

export const paymentsRouter = Router()
paymentsRouter.use(requireAuth)

type Row = Record<string, unknown>

const mapPayment = (r: Row) => ({
  id: r.id,
  reference: r.reference,
  patientId: r.patient_id,
  providerId: r.provider_id ?? undefined,
  service: r.service,
  providerName: r.provider_name,
  date: r.date,
  amount: r.amount,
  method: r.method,
  status: r.status,
  breakdown: JSON.parse(r.breakdown as string) as { label: string; amount: number }[],
})

const createSchema = z.object({
  service: z.string(),
  providerName: z.string(),
  providerId: z.string().optional(),
  amount: z.number(),
  method: z.enum(['orange_money', 'mvola']),
  breakdown: z.array(z.object({ label: z.string(), amount: z.number() })),
})

paymentsRouter.get('/', (req: Request, res: Response) => {
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
  const rows = db
    .prepare(`SELECT * FROM payments WHERE ${where.join(' AND ')} ORDER BY date DESC`)
    .all(...params) as Row[]
  res.json(rows.map(mapPayment))
})

paymentsRouter.post('/', (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const input = parsed.data
  const payment = {
    id: `pay-${Date.now()}`,
    reference: generateReference('PAY'),
    patientId: req.auth!.id,
    providerId: input.providerId ?? null,
    service: input.service,
    providerName: input.providerName,
    date: todayIso(),
    amount: input.amount,
    method: input.method,
    status: 'success',
    breakdown: input.breakdown,
  }
  db.prepare(`
    INSERT INTO payments (id, reference, patient_id, provider_id, service, provider_name, date, amount, method, status, breakdown)
    VALUES (@id, @reference, @patientId, @providerId, @service, @providerName, @date, @amount, @method, @status, @breakdown)
  `).run({ ...payment, breakdown: JSON.stringify(payment.breakdown) })
  res.status(201).json(mapPayment({ ...payment, provider_id: payment.providerId, breakdown: JSON.stringify(payment.breakdown) }))
})

paymentsRouter.get('/summary', (req: Request, res: Response) => {
  const auth = req.auth!
  if (auth.role === 'patient' || !auth.providerId) {
    res.json({ total: 0, count: 0 })
    return
  }
  const row = db
    .prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
      FROM payments WHERE provider_id = ? AND status = 'success'
    `)
    .get(auth.providerId) as { total: number; count: number }
  res.json({ total: row.total, count: row.count })
})