import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { createDeliveryOrder, updateDeliveryStatus, getActiveDeliveries, canTransitionDelivery } from '../deliveryWorkflow.js'

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
  const auth = req.auth!
  
  // Pharmacy and delivery providers see all active deliveries
  if (auth.role === 'pharmacy' || auth.role === 'ambulance_driver' || auth.role === 'admin') {
    const deliveries = await getActiveDeliveries()
    res.json(deliveries)
    return
  }
  
  // Patients see only their own
  const rows = (
    await db.query('SELECT * FROM delivery_orders WHERE patient_id = ? ORDER BY date DESC', [auth.id])
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

  try {
    const id = await createDeliveryOrder({
      patientId: req.auth!.id,
      medicineId: input.medicineId,
      quantity: input.quantity,
      deliveryAddress: input.deliveryAddress,
      deliveryTimeSlot: input.deliveryTimeSlot,
      prescriptionConfirmed: input.prescriptionConfirmed,
    })

    const stored = (await db.query('SELECT * FROM delivery_orders WHERE id = $1', [id])).rows[0] as Row
    res.status(201).json(mapDelivery(stored))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    const status = message.includes('not found') ? 404 : message.includes('not available') || message.includes('Prescription') || message.includes('stock') ? 409 : 500
    res.status(status).json({ error: message })
  }
})

const statusSchema = z.object({
  status: z.enum(['received', 'pharmacy_confirmed', 'preparing', 'delivery_assigned', 'in_delivery', 'delivered']),
  deliveryPerson: z.string().optional(),
})

deliveriesRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const auth = req.auth!
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Statut invalide' })
    return
  }

  const row = (await db.query('SELECT * FROM delivery_orders WHERE id = ?', [req.params.id])).rows[0] as
    | Row
    | undefined
  if (!row) {
    res.status(404).json({ error: 'Commande introuvable' })
    return
  }

  // Only pharmacy and delivery providers can update status
  if (auth.role !== 'pharmacy' && auth.role !== 'ambulance_driver' && auth.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const currentStatus = String(row.status) as 'received' | 'pharmacy_confirmed' | 'preparing' | 'delivery_assigned' | 'in_delivery' | 'delivered'
  const nextStatus = parsed.data.status

  if (!canTransitionDelivery(currentStatus, nextStatus)) {
    res.status(409).json({ error: `Transition ${currentStatus} → ${nextStatus} non autorisée` })
    return
  }

  try {
    await updateDeliveryStatus(String(req.params.id), nextStatus, parsed.data.deliveryPerson)
    const updated = (await db.query('SELECT * FROM delivery_orders WHERE id = ?', [req.params.id])).rows[0] as Row
    res.json(mapDelivery(updated))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur serveur' })
  }
})
