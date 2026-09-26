import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, todayIso } from '../helpers.js'

export const deliveriesRouter = Router()
deliveriesRouter.use(requireAuth)

type Row = Record<string, unknown>

const mapDelivery = (r: Row) => ({
  id: r.id,
  reference: r.reference,
  patientId: r.patient_id,
  medicineId: r.medicine_id,
  medicineName: r.medicine_name,
  dose: r.dose,
  quantity: r.quantity,
  pharmacyId: r.pharmacy_id,
  pharmacyName: r.pharmacy_name,
  deliveryAddress: r.delivery_address,
  deliveryTimeSlot: r.delivery_time_slot,
  deliveryFee: r.delivery_fee,
  total: r.total,
  status: r.status,
  date: r.date,
})

const createSchema = z.object({
  medicineId: z.string(),
  medicineName: z.string(),
  dose: z.string(),
  quantity: z.number().int().positive(),
  pharmacyId: z.string(),
  pharmacyName: z.string(),
  deliveryAddress: z.string(),
  deliveryTimeSlot: z.string(),
  deliveryFee: z.number(),
  total: z.number(),
})

deliveriesRouter.get('/', async (req: Request, res: Response) => {
  const rows = (
    await db.query('SELECT * FROM delivery_orders WHERE patient_id = ? ORDER BY date DESC', [req.auth!.id])
  ).rows as Row[]
  res.json(rows.map(mapDelivery))
})

deliveriesRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const input = parsed.data
  const order = {
    id: `del-${Date.now()}`,
    reference: generateReference('DEL'),
    patientId: req.auth!.id,
    medicineId: input.medicineId,
    medicineName: input.medicineName,
    dose: input.dose,
    quantity: input.quantity,
    pharmacyId: input.pharmacyId,
    pharmacyName: input.pharmacyName,
    deliveryAddress: input.deliveryAddress,
    deliveryTimeSlot: input.deliveryTimeSlot,
    deliveryFee: input.deliveryFee,
    total: input.total,
    status: 'received',
    date: todayIso(),
  }
  await db.query(
    `INSERT INTO delivery_orders (id, reference, patient_id, medicine_id, medicine_name, dose, quantity, pharmacy_id, pharmacy_name, delivery_address, delivery_time_slot, delivery_fee, total, status, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.reference,
      order.patientId,
      order.medicineId,
      order.medicineName,
      order.dose,
      order.quantity,
      order.pharmacyId,
      order.pharmacyName,
      order.deliveryAddress,
      order.deliveryTimeSlot,
      order.deliveryFee,
      order.total,
      order.status,
      order.date,
    ],
  )
  res.status(201).json(mapDelivery(order))
})