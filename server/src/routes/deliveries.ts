import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, todayIso, uniqueId } from '../helpers.js'
import { deliveryFeeFor } from '../catalog.js'

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

/**
 * Only the address, time slot and quantity are client-supplied. Medicine name,
 * dose, pharmacy, unit price, delivery fee and total all come from the
 * medicines row, so a caller cannot order a 50,000 Ar medicine for 100 Ar.
 */
const createSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  deliveryAddress: z.string().min(3).max(300),
  deliveryTimeSlot: z.string().min(1).max(80),
  prescriptionConfirmed: z.boolean().optional(),
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

  const medicine = (await db.query('SELECT * FROM medicines WHERE id = ?', [input.medicineId])).rows[0] as
    | Row
    | undefined
  if (!medicine) {
    res.status(404).json({ error: 'Médicament introuvable' })
    return
  }
  if (medicine.available !== 1) {
    res.status(409).json({ error: 'Ce médicament n’est pas disponible' })
    return
  }
  // `prescription_required` is surfaced in the catalog but was never enforced,
  // so prescription-only medicines could be ordered with no check at all.
  if (medicine.prescription_required === 1 && !input.prescriptionConfirmed) {
    res.status(400).json({ error: 'Ce médicament nécessite une ordonnance' })
    return
  }

  const unitPrice = Number(medicine.price)
  const stock = Number(medicine.stock)
  if (input.quantity > stock) {
    res.status(409).json({ error: `Stock insuffisant (${stock} restant)` })
    return
  }
  const subtotal = unitPrice * input.quantity
  const deliveryFee = deliveryFeeFor(subtotal)

  const order = {
    id: uniqueId('del'),
    reference: generateReference('DEL'),
    patientId: req.auth!.id,
    medicineId: input.medicineId,
    medicineName: String(medicine.name),
    dose: String(medicine.dose),
    quantity: input.quantity,
    pharmacyId: String(medicine.pharmacy_id),
    pharmacyName: String(medicine.pharmacy_name),
    deliveryAddress: input.deliveryAddress,
    deliveryTimeSlot: input.deliveryTimeSlot,
    deliveryFee,
    total: subtotal + deliveryFee,
    status: 'received',
    date: todayIso(),
  }

  // Decrement stock alongside the insert so concurrent orders cannot oversell
  // the same units.
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query(
      'UPDATE medicines SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [input.quantity, input.medicineId, input.quantity],
    )
    if ((updated.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK')
      res.status(409).json({ error: 'Stock insuffisant' })
      return
    }
    await client.query(
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
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  res.status(201).json(mapDelivery(order))
})