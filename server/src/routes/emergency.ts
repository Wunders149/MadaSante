import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { generateReference, todayIso } from '../helpers.js'

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

const createSchema = z.object({
  patientName: z.string(),
  phone: z.string(),
  location: z.string(),
  emergencyType: z.string(),
  destinationHospital: z.string(),
})

emergencyRouter.get('/', async (req: Request, res: Response) => {
  const rows = (
    await db.query('SELECT * FROM emergency_requests WHERE patient_id = ? ORDER BY date DESC', [req.auth!.id])
  ).rows as Row[]
  res.json(rows.map(mapEmergency))
})

emergencyRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const input = parsed.data
  const request = {
    id: `erg-${Date.now()}`,
    reference: generateReference('AMBU'),
    patientId: req.auth!.id,
    patientName: input.patientName,
    phone: input.phone,
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