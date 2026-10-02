import { db } from './db.js'
import { generateReference, todayIso, uniqueId } from './helpers.js'
import { emitToUser } from './realtime.js'

/**
 * Payment abstraction layer.
 *
 * PaymentProvider
 * ├── OrangeMoneyProvider
 * └── MvolaProvider
 *
 * Each provider handles the specific integration with the mobile money
 * service, while the shared logic (recording, status transitions,
 * notifications) lives here.
 */

export type PaymentMethod = 'orange_money' | 'mvola'
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'refunded'

export interface PaymentResult {
  success: boolean
  reference: string
  message: string
}

export interface PaymentProvider {
  method: PaymentMethod
  name: string
  processPayment(input: {
    amount: number
    phone: string
    reference: string
    description: string
  }): Promise<PaymentResult>
}

/**
 * Orange Money payment provider.
 *
 * In production, this would integrate with the Orange Money API.
 * For now, it simulates a successful payment.
 */
export class OrangeMoneyProvider implements PaymentProvider {
  method: PaymentMethod = 'orange_money'
  name = 'Orange Money'

  async processPayment(input: {
    amount: number
    phone: string
    reference: string
    description: string
  }): Promise<PaymentResult> {
    // Simulate API call to Orange Money
    // In production: POST to Orange Money API with input.phone, input.amount
    console.log(`[Orange Money] Processing ${input.amount} Ar to ${input.phone} for ${input.description}`)
    
    // Simulate success (95% success rate for demo)
    const success = Math.random() > 0.05
    
    return {
      success,
      reference: input.reference,
      message: success ? 'Paiement Orange Money confirmé' : 'Paiement Orange Money échoué',
    }
  }
}

/**
 * MVola payment provider.
 *
 * In production, this would integrate with the MVola API.
 * For now, it simulates a successful payment.
 */
export class MvolaProvider implements PaymentProvider {
  method: PaymentMethod = 'mvola'
  name = 'MVola'

  async processPayment(input: {
    amount: number
    phone: string
    reference: string
    description: string
  }): Promise<PaymentResult> {
    // Simulate API call to MVola
    // In production: POST to MVola API with input.phone, input.amount
    console.log(`[MVola] Processing ${input.amount} Ar to ${input.phone} for ${input.description}`)
    
    // Simulate success (95% success rate for demo)
    const success = Math.random() > 0.05
    
    return {
      success,
      reference: input.reference,
      message: success ? 'Paiement MVola confirmé' : 'Paiement MVola échoué',
    }
  }
}

/**
 * Provider registry.
 */
const providers: Record<PaymentMethod, PaymentProvider> = {
  orange_money: new OrangeMoneyProvider(),
  mvola: new MvolaProvider(),
}

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return providers[method]
}

/**
 * Create and process a payment.
 */
export async function processPayment(input: {
  patientId: string
  appointmentId?: string
  providerId?: string
  service: string
  providerName: string
  amount: number
  method: PaymentMethod
  phone: string
  breakdown: { label: string; amount: number }[]
}): Promise<{ id: string; reference: string; status: PaymentStatus }> {
  const provider = getPaymentProvider(input.method)
  const reference = generateReference('PAY')
  
  // Create pending payment record
  const paymentId = uniqueId('pay')
  await db.query(
    `INSERT INTO payments (id, reference, patient_id, provider_id, appointment_id, service, provider_name, date, amount, method, status, breakdown)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      paymentId,
      reference,
      input.patientId,
      input.providerId ?? null,
      input.appointmentId ?? null,
      input.service,
      input.providerName,
      todayIso(),
      input.amount,
      input.method,
      'processing',
      JSON.stringify(input.breakdown),
    ]
  )

  // Process payment through provider
  const result = await provider.processPayment({
    amount: input.amount,
    phone: input.phone,
    reference,
    description: input.service,
  })

  const status: PaymentStatus = result.success ? 'success' : 'failed'
  
  // Update payment status
  await db.query('UPDATE payments SET status = $1 WHERE id = $2', [status, paymentId])

  // Emit real-time event
  emitToUser(input.patientId, 'payment.updated', {
    paymentId,
    reference,
    status,
    amount: input.amount,
    method: input.method,
  })

  // Create notification
  await createNotification({
    userId: input.patientId,
    title: result.success ? 'Paiement confirmé' : 'Paiement échoué',
    message: result.message,
    category: 'payment',
  })

  return { id: paymentId, reference, status }
}

/**
 * Create a notification for a user.
 */
export async function createNotification(input: {
  userId: string
  title: string
  message: string
  category: 'appointment' | 'payment' | 'delivery' | 'emergency' | 'system'
  link?: string
}): Promise<{ id: string; title: string; message: string; category: typeof input.category; read: boolean; createdAt: string; link?: string }> {
  const id = uniqueId('notif')
  const createdAt = new Date().toISOString()
  await db.query(
    `INSERT INTO notifications (id, user_id, title, message, category, read, created_at, link)
     VALUES ($1, $2, $3, $4, $5, 0, $6, $7)`,
    [id, input.userId, input.title, input.message, input.category, createdAt, input.link ?? null]
  )

  // Emit real-time notification
  const notification = {
    id,
    title: input.title,
    message: input.message,
    category: input.category,
    read: false,
    createdAt,
    link: input.link,
  }
  emitToUser(input.userId, 'notification.created', notification)
  return notification
}
