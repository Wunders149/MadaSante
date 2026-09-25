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

emergencyRouter.get('/', (req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM emergency_requests WHERE patient_id = ? ORDER BY date DESC')
    .all(req.auth!.id) as Row[]
  res.json(rows.map(mapEmergency))
})

emergencyRouter.post('/', (req: Request, res: Response) => {
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
  db.prepare(`
    INSERT INTO emergency_requests (id, reference, patient_id, patient_name, phone, location, emergency_type, destination_hospital, status, ambulance, date)
    VALUES (@id, @reference, @patientId, @patientName, @phone, @location, @emergencyType, @destinationHospital, @status, @ambulance, @date)
  `).run(request)
  res.status(201).json(mapEmergency(request))
})