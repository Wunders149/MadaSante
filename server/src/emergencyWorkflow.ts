import { db } from './db.js'
import { generateReference, todayIso, uniqueId } from './helpers.js'
import { emitToUser, emitToAmbulanceDispatch, emitToAdminMonitor } from './realtime.js'
import { createNotification } from './payments.js'

/**
 * Emergency & Ambulance workflow.
 *
 * Status flow:
 *   received → searching → assigned → en_route → arrived → completed
 *
 * The patient sees real-time updates as the ambulance progresses.
 */

export type EmergencyStatus = 'received' | 'searching' | 'assigned' | 'en_route' | 'arrived' | 'completed'

const VALID_TRANSITIONS: Record<EmergencyStatus, EmergencyStatus[]> = {
  received: ['searching'],
  searching: ['assigned', 'completed'],
  assigned: ['en_route', 'completed'],
  en_route: ['arrived', 'completed'],
  arrived: ['completed'],
  completed: [],
}

export function canTransitionEmergency(from: EmergencyStatus, to: EmergencyStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Create a new emergency request.
 */
export async function createEmergencyRequest(input: {
  patientId: string
  patientName: string
  phone: string
  location: string
  emergencyType: string
  destinationHospital: string
  description?: string
  numberOfPatients?: number
}): Promise<string> {
  const id = uniqueId('erg')
  const reference = generateReference('AMBU')
  
  await db.query(
    `INSERT INTO emergency_requests (id, reference, patient_id, patient_name, phone, location, emergency_type, destination_hospital, status, ambulance, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'searching', NULL, $9)`,
    [id, reference, input.patientId, input.patientName, input.phone, input.location, input.emergencyType, input.destinationHospital, todayIso()]
  )

  // Notify ambulance providers
  emitToAmbulanceDispatch('emergency.new', {
    id,
    reference,
    location: input.location,
    emergencyType: input.emergencyType,
    destinationHospital: input.destinationHospital,
  })

  // Notify admins
  emitToAdminMonitor('emergency.received', {
    id,
    reference,
    patientName: input.patientName,
    location: input.location,
    emergencyType: input.emergencyType,
  })

  // Create notification for patient
  await createNotification({
    userId: input.patientId,
    title: 'Demande d\'urgence envoyée',
    message: `Votre demande ${reference} est en cours de traitement. Une ambulance sera bientôt assignée.`,
    category: 'emergency',
  })

  return id
}

/**
 * Update emergency request status.
 */
export async function updateEmergencyStatus(
  id: string,
  status: EmergencyStatus,
  ambulanceProvider?: string
): Promise<void> {
  const row = (await db.query('SELECT * FROM emergency_requests WHERE id = $1', [id])).rows[0] as
    | { status: EmergencyStatus; patient_id: string; reference: string }
    | undefined
  
  if (!row) throw new Error('Emergency request not found')
  
  if (!canTransitionEmergency(row.status, status)) {
    throw new Error(`Cannot transition from ${row.status} to ${status}`)
  }

  await db.query(
    'UPDATE emergency_requests SET status = $1, ambulance = COALESCE($2, ambulance) WHERE id = $3',
    [status, ambulanceProvider ?? null, id]
  )

  // Emit real-time updates
  emitToUser(String(row.patient_id), 'emergency.updated', {
    id,
    reference: row.reference,
    status,
    ambulance: ambulanceProvider,
  })

  emitToAdminMonitor('emergency.status', {
    id,
    reference: row.reference,
    status,
  })

  // Create notifications for key status changes
  const statusMessages: Record<EmergencyStatus, string> = {
    received: 'Demande reçue',
    searching: 'Recherche d\'ambulance en cours',
    assigned: 'Une ambulance a été assignée',
    en_route: 'L\'ambulance est en route',
    arrived: 'L\'ambulance est arrivée',
    completed: 'Mission terminée',
  }

  await createNotification({
    userId: String(row.patient_id),
    title: `Urgence ${row.reference}`,
    message: statusMessages[status],
    category: 'emergency',
  })
}

/**
 * Get emergency requests for a patient.
 */
export async function getPatientEmergencies(patientId: string): Promise<unknown[]> {
  const rows = (
    await db.query('SELECT * FROM emergency_requests WHERE patient_id = $1 ORDER BY date DESC', [patientId])
  ).rows
  return rows.map(mapEmergency)
}

/**
 * Get all active emergency requests (for ambulance providers and admins).
 */
export async function getActiveEmergencies(): Promise<unknown[]> {
  const rows = (
    await db.query(
      `SELECT * FROM emergency_requests 
       WHERE status NOT IN ('completed') 
       ORDER BY date DESC`
    )
  ).rows
  return rows.map(mapEmergency)
}

function mapEmergency(r: Record<string, unknown>) {
  return {
    id: r.id,
    reference: r.reference,
    patientId: r.patient_id,
    patientName: r.patient_name,
    phone: r.phone,
    location: r.location,
    emergencyType: r.emergency_type,
    destinationHospital: r.destination_hospital,
    status: r.status,
    ambulance: r.ambulance ?? undefined,
    date: r.date,
  }
}
