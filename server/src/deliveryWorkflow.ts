import { db } from './db.js'
import { generateReference, todayIso, uniqueId } from './helpers.js'
import { emitToUser, emitToProviders } from './realtime.js'
import { createNotification } from './payments.js'

/**
 * Medication Delivery workflow.
 *
 * Status flow:
 *   received → pharmacy_confirmed → preparing → delivery_assigned → in_delivery → delivered
 *
 * The patient sees real-time updates as the order progresses.
 */

export type DeliveryStatus =
  | 'received'
  | 'pharmacy_confirmed'
  | 'preparing'
  | 'delivery_assigned'
  | 'in_delivery'
  | 'delivered'

const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  received: ['pharmacy_confirmed'],
  pharmacy_confirmed: ['preparing'],
  preparing: ['delivery_assigned'],
  delivery_assigned: ['in_delivery'],
  in_delivery: ['delivered'],
  delivered: [],
}

export function canTransitionDelivery(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Create a new delivery order.
 */
export async function createDeliveryOrder(input: {
  patientId: string
  medicineId: string
  quantity: number
  deliveryAddress: string
  deliveryTimeSlot: string
  prescriptionConfirmed?: boolean
}): Promise<string> {
  const medicine = (await db.query('SELECT * FROM medicines WHERE id = $1', [input.medicineId])).rows[0] as
    | { id: string; name: string; dose: string; price: number; pharmacy_id: string; pharmacy_name: string; stock: number; available: number; prescription_required: number }
    | undefined

  if (!medicine) throw new Error('Medicine not found')
  if (medicine.available !== 1) throw new Error('Medicine not available')
  if (medicine.prescription_required === 1 && !input.prescriptionConfirmed) {
    throw new Error('Prescription required')
  }
  if (input.quantity > medicine.stock) {
    throw new Error(`Insufficient stock (${medicine.stock} remaining)`)
  }

  const unitPrice = Number(medicine.price)
  const subtotal = unitPrice * input.quantity
  const deliveryFee = subtotal >= 20000 ? 0 : 3500
  const total = subtotal + deliveryFee

  const id = uniqueId('del')
  const reference = generateReference('DEL')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    
    // Decrement stock
    const updated = await client.query(
      'UPDATE medicines SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
      [input.quantity, input.medicineId]
    )
    if ((updated.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK')
      throw new Error('Insufficient stock')
    }

    // Create order
    await client.query(
      `INSERT INTO delivery_orders (id, reference, patient_id, medicine_id, medicine_name, dose, quantity, pharmacy_id, pharmacy_name, delivery_address, delivery_time_slot, delivery_fee, total, status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'received', $15)`,
      [
        id,
        reference,
        input.patientId,
        input.medicineId,
        medicine.name,
        medicine.dose,
        input.quantity,
        medicine.pharmacy_id,
        medicine.pharmacy_name,
        input.deliveryAddress,
        input.deliveryTimeSlot,
        deliveryFee,
        total,
        todayIso(),
      ]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  // Notify pharmacy
  emitToProviders('delivery.new', {
    id,
    reference,
    medicineName: medicine.name,
    quantity: input.quantity,
    pharmacyId: medicine.pharmacy_id,
    deliveryAddress: input.deliveryAddress,
  })

  // Create notification for patient
  await createNotification({
    userId: input.patientId,
    title: 'Commande créée',
    message: `Votre commande ${reference} a été créée et envoyée à la pharmacie.`,
    category: 'delivery',
  })

  return id
}

/**
 * Update delivery order status.
 */
export async function updateDeliveryStatus(
  id: string,
  status: DeliveryStatus,
  deliveryPerson?: string
): Promise<void> {
  const row = (await db.query('SELECT * FROM delivery_orders WHERE id = $1', [id])).rows[0] as
    | { status: DeliveryStatus; patient_id: string; reference: string; medicine_name: string }
    | undefined

  if (!row) throw new Error('Delivery order not found')

  if (!canTransitionDelivery(row.status, status)) {
    throw new Error(`Cannot transition from ${row.status} to ${status}`)
  }

  await db.query('UPDATE delivery_orders SET status = $1 WHERE id = $2', [status, id])

  // Emit real-time updates
  emitToUser(String(row.patient_id), 'delivery.updated', {
    id,
    reference: row.reference,
    status,
    deliveryPerson,
    medicineName: row.medicine_name,
  })

  // Create notifications for key status changes
  const statusMessages: Record<DeliveryStatus, string> = {
    received: 'Commande reçue',
    pharmacy_confirmed: 'Pharmacie confirmée',
    preparing: 'En préparation',
    delivery_assigned: 'Livreur assigné',
    in_delivery: 'En livraison',
    delivered: 'Livré',
  }

  await createNotification({
    userId: row.patient_id,
    title: `Livraison ${row.reference}`,
    message: statusMessages[status],
    category: 'delivery',
  })
}

/**
 * Get delivery orders for a patient.
 */
export async function getPatientDeliveries(patientId: string): Promise<unknown[]> {
  const rows = (
    await db.query('SELECT * FROM delivery_orders WHERE patient_id = $1 ORDER BY date DESC', [patientId])
  ).rows
  return rows.map(mapDelivery)
}

/**
 * Get all active delivery orders (for providers).
 */
export async function getActiveDeliveries(): Promise<unknown[]> {
  const rows = (
    await db.query(
      `SELECT * FROM delivery_orders 
       WHERE status NOT IN ('delivered') 
       ORDER BY date DESC`
    )
  ).rows
  return rows.map(mapDelivery)
}

function mapDelivery(r: Record<string, unknown>) {
  return {
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
  }
}
