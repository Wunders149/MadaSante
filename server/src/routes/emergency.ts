import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { rateLimit } from '../rateLimit.js'
import { createEmergencyRequest, updateEmergencyStatus, getActiveEmergencies, canTransitionEmergency } from '../emergencyWorkflow.js'

export const emergencyRouter = Router()
emergencyRouter.use(requireAuth)

type Row = Record<string, unknown>

const mapEmergency = (r: Row) => ({
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
})

/**
 * The patient's name and phone are taken from the authenticated account, not
 * from the body. They were previously taken from the body, so a request record
 * could name and phone an arbitrary person.
 */
const createSchema = z.object({
  location: z.string().min(2).max(300),
  emergencyType: z.string().min(2).max(80),
  destinationHospital: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  numberOfPatients: z.number().int().min(1).max(10).optional(),
})

emergencyRouter.get('/', async (req: Request, res: Response) => {
  const auth = req.auth!
  
  // Ambulance providers and admins see all active emergencies
  if (auth.role === 'ambulance_driver' || auth.role === 'admin') {
    const emergencies = await getActiveEmergencies()
    res.json(emergencies)
    return
  }
  
  // Patients see only their own
  const rows = (
    await db.query('SELECT * FROM emergency_requests WHERE patient_id = ? ORDER BY date DESC', [auth.id])
  ).rows as Row[]
  res.json(rows.map(mapEmergency))
})

emergencyRouter.post('/', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const input = parsed.data
  const account = (await db.query('SELECT first_name, last_name, phone FROM users WHERE id = $1', [req.auth!.id]))
    .rows[0] as { first_name: string; last_name: string; phone: string } | undefined
  if (!account) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }

  try {
    const id = await createEmergencyRequest({
      patientId: req.auth!.id,
      patientName: `${account.first_name} ${account.last_name}`.trim(),
      phone: account.phone,
      location: input.location,
      emergencyType: input.emergencyType,
      destinationHospital: input.destinationHospital,
      description: input.description,
      numberOfPatients: input.numberOfPatients,
    })

    const stored = (await db.query('SELECT * FROM emergency_requests WHERE id = $1', [id])).rows[0] as Row
    res.status(201).json(mapEmergency(stored))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur serveur' })
  }
})

const statusSchema = z.object({
  status: z.enum(['received', 'searching', 'assigned', 'en_route', 'arrived', 'completed']),
  ambulanceProvider: z.string().optional(),
})

emergencyRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const auth = req.auth!
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Statut invalide' })
    return
  }

  const row = (await db.query('SELECT * FROM emergency_requests WHERE id = ?', [req.params.id])).rows[0] as
    | Row
    | undefined
  if (!row) {
    res.status(404).json({ error: 'Demande introuvable' })
    return
  }

  // Only ambulance providers and admins can update status
  if (auth.role !== 'ambulance_driver' && auth.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const currentStatus = String(row.status) as 'received' | 'searching' | 'assigned' | 'en_route' | 'arrived' | 'completed'
  const nextStatus = parsed.data.status

  if (!canTransitionEmergency(currentStatus, nextStatus)) {
    res.status(409).json({ error: `Transition ${currentStatus} → ${nextStatus} non autorisée` })
    return
  }

  try {
    await updateEmergencyStatus(String(req.params.id), nextStatus, parsed.data.ambulanceProvider)
    const updated = (await db.query('SELECT * FROM emergency_requests WHERE id = ?', [req.params.id])).rows[0] as Row
    res.json(mapEmergency(updated))
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur serveur' })
  }
})
