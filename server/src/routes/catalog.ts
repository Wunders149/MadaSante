import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db.js'
import { CITIES } from '../seed-data.js'

export const catalogRouter = Router()

const parse = (value: string) => JSON.parse(value) as unknown
const bool = (value: number | null | undefined) => value === 1

type Row = Record<string, unknown>

function mapDoctor(r: Row) {
  return {
    id: r.id,
    name: r.name,
    specialty: r.specialty,
    type: r.type,
    location: r.location,
    city: r.city,
    consultationTypes: parse(r.consultation_types as string),
    price: r.price,
    priceHome: r.price_home == null ? undefined : r.price_home,
    availability: parse(r.availability as string),
    availabilitySlots: parse(r.availability_slots as string),
    photo: r.photo,
    rating: r.rating,
    reviews: r.reviews,
    description: r.description,
    languages: parse(r.languages as string),
  }
}

function mapHospital(r: Row) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    sector: r.sector,
    location: r.location,
    city: r.city,
    services: parse(r.services as string),
    openingHours: r.opening_hours,
    emergencyAvailable: bool(r.emergency_available as number),
    phone: r.phone,
    rating: r.rating,
    description: r.description,
  }
}

function mapPharmacy(r: Row) {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    city: r.city,
    phone: r.phone,
    openingHours: r.opening_hours,
    deliveryAvailable: bool(r.delivery_available as number),
    rating: r.rating,
  }
}

function mapMedicine(r: Row) {
  return {
    id: r.id,
    name: r.name,
    genericName: r.generic_name,
    form: r.form,
    dose: r.dose,
    price: r.price,
    pharmacyId: r.pharmacy_id,
    pharmacyName: r.pharmacy_name,
    location: r.location,
    city: r.city,
    stock: r.stock,
    available: bool(r.available as number),
    prescriptionRequired: bool(r.prescription_required as number),
  }
}

function mapLaboratory(r: Row) {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    city: r.city,
    tests: parse(r.tests as string),
    openingHours: r.opening_hours,
    phone: r.phone,
    rating: r.rating,
  }
}

function mapImagingCenter(r: Row) {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    city: r.city,
    exams: parse(r.exams as string),
    openingHours: r.opening_hours,
    phone: r.phone,
    rating: r.rating,
  }
}

function mapNurse(r: Row) {
  return {
    id: r.id,
    name: r.name,
    qualification: r.qualification,
    location: r.location,
    city: r.city,
    services: parse(r.services as string),
    availability: parse(r.availability as string),
    price: r.price,
    photo: r.photo,
    rating: r.rating,
  }
}

function mapAmbulance(r: Row) {
  return {
    id: r.id,
    provider: r.provider,
    location: r.location,
    city: r.city,
    phone: r.phone,
    vehicles: parse(r.vehicles as string),
    available: bool(r.available as number),
    responseTime: r.response_time,
  }
}

const like = (query: string | undefined) => (query ? `%${query.toLowerCase()}%` : undefined)

const collectFilters = (req: Request) => {
  const out: { where: string[]; params: unknown[] } = { where: [], params: [] }
  const q = like(String(req.query.q ?? ''))
  const city = String(req.query.city ?? '') || undefined
  const type = String(req.query.type ?? '') || undefined
  const sector = String(req.query.sector ?? '') || undefined
  if (q) {
    out.where.push('(LOWER(name) LIKE ? OR LOWER(city) LIKE ?)')
    out.params.push(q, q)
  }
  if (city) {
    out.where.push('city = ?')
    out.params.push(city)
  }
  if (type) {
    out.where.push('type = ?')
    out.params.push(type)
  }
  if (sector) {
    out.where.push('sector = ?')
    out.params.push(sector)
  }
  return out
}

const list = (table: string, mapper: (r: Row) => unknown, orderBy = 'name') => (req: Request, res: Response) => {
  const { where, params } = collectFilters(req)
  const rows = db
    .prepare(`SELECT * FROM ${table}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY ${orderBy}`)
    .all(...params) as Row[]
  res.json(rows.map(mapper))
}

catalogRouter.get('/doctors', (req: Request, res: Response) => {
  const q = like(String(req.query.q ?? ''))
  const city = String(req.query.city ?? '') || undefined
  const type = String(req.query.type ?? '') || undefined
  const where: string[] = []
  const params: unknown[] = []
  if (q) where.push('(LOWER(name) LIKE ? OR LOWER(specialty) LIKE ? OR LOWER(city) LIKE ?)')
  if (city) where.push('city = ?')
  if (type) where.push('type = ?')
  if (q) params.push(q, q, q)
  if (city) params.push(city)
  if (type) params.push(type)
  const rows = db
    .prepare(`SELECT * FROM doctors${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY rating DESC`)
    .all(...params) as Row[]
  res.json(rows.map(mapDoctor))
})

catalogRouter.get('/doctors/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id) as Row | undefined
  if (!row) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(mapDoctor(row))
})

catalogRouter.get('/hospitals', (req: Request, res: Response) => {
  const q = like(String(req.query.q ?? ''))
  const city = String(req.query.city ?? '') || undefined
  const type = String(req.query.type ?? '') || undefined
  const sector = String(req.query.sector ?? '') || undefined
  const where: string[] = []
  const params: unknown[] = []
  if (q) where.push('(LOWER(name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(services) LIKE ?)')
  if (city) where.push('city = ?')
  if (type) where.push('type = ?')
  if (sector) where.push('sector = ?')
  if (q) params.push(q, q, q)
  if (city) params.push(city)
  if (type) params.push(type)
  if (sector) params.push(sector)
  const rows = db
    .prepare(`SELECT * FROM hospitals${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY rating DESC`)
    .all(...params) as Row[]
  res.json(rows.map(mapHospital))
})

catalogRouter.get('/pharmacies', list('pharmacies', mapPharmacy))
catalogRouter.get('/medicines', list('medicines', mapMedicine))
catalogRouter.get('/laboratories', list('laboratories', mapLaboratory))

catalogRouter.get('/imaging-centers', (req: Request, res: Response) => {
  const q = like(String(req.query.q ?? ''))
  const city = String(req.query.city ?? '') || undefined
  const where: string[] = []
  const params: unknown[] = []
  if (q) where.push('(LOWER(name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(exams) LIKE ?)')
  if (city) where.push('city = ?')
  if (q) params.push(q, q, q)
  if (city) params.push(city)
  const rows = db
    .prepare(`SELECT * FROM imaging_centers${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY rating DESC`)
    .all(...params) as Row[]
  res.json(rows.map(mapImagingCenter))
})

catalogRouter.get('/nurses', (req: Request, res: Response) => {
  const q = like(String(req.query.q ?? ''))
  const city = String(req.query.city ?? '') || undefined
  const where: string[] = []
  const params: unknown[] = []
  if (q) where.push('(LOWER(name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(services) LIKE ?)')
  if (city) where.push('city = ?')
  if (q) params.push(q, q, q)
  if (city) params.push(city)
  const rows = db
    .prepare(`SELECT * FROM nurses${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY rating DESC`)
    .all(...params) as Row[]
  res.json(rows.map(mapNurse))
})

catalogRouter.get('/ambulances', list('ambulances', mapAmbulance, 'provider'))

catalogRouter.get('/summary', (_req: Request, res: Response) => {
  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n
  res.json({
    doctors: count('doctors'),
    medicines: count('medicines'),
    labs: count('laboratories'),
    imaging: count('imaging_centers'),
    nurses: count('nurses'),
    facilities: count('hospitals'),
  })
})

catalogRouter.get('/cities', (_req: Request, res: Response) => {
  res.json(CITIES)
})