import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, todayIso, uniqueId } from '../helpers.js'
import { rateLimit } from '../rateLimit.js'

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
})

emergencyRouter.get('/', async (req: Request, res: Response) => {
  const rows = (
    await db.query('SELECT * FROM emergency_requests WHERE patient_id = ? ORDER BY date DESC', [req.auth!.id])
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
  const request = {
    id: uniqueId('erg'),
    reference: generateReference('AMBU'),
    patientId: req.auth!.id,
    patientName: `${account.first_name} ${account.last_name}`.trim(),
    phone: account.phone,
    location: input.location,
    emergencyType: input.emergencyType,
    destinationHospital: input.destinationHospital,
    status: 'searching',
    ambulance: null,
    date: todayIso(),
  }
  await db.query(
    `INSERT INTO emergency_requests (id, reference, patient_id, patient_name, phone, location, emergency_type, destination_hospital, status, ambulance, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      request.id,
      request.reference,
      request.patientId,
      request.patientName,
      request.phone,
      request.location,
      request.emergencyType,
      request.destinationHospital,
      request.status,
      request.ambulance,
      request.date,
    ],
  )
  // Re-read the stored row: mapEmergency reads snake_case columns, so mapping
  // the camelCase literal returned a response with patientName, emergencyType
  // and destinationHospital all empty.
  const stored = (await db.query('SELECT * FROM emergency_requests WHERE id = $1', [request.id])).rows[0] as Row
  res.status(201).json(mapEmergency(stored))
})