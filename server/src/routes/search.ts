import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db.js'

export const searchRouter = Router()

type Row = Record<string, unknown>

const parse = (value: string) => JSON.parse(value) as unknown

const qmatch = (row: Row, fields: string[], q: string) =>
  fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q))

searchRouter.get('/search', (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim().toLowerCase()
  const category = String(req.query.category ?? 'all')

  const empty = {
    doctors: [],
    medicines: [],
    facilities: [],
    laboratories: [],
    imaging: [],
    nurses: [],
    total: 0,
  }

  if (!q) {
    res.json(empty)
    return
  }

  const doctors = (db.prepare('SELECT * FROM doctors').all() as Row[]).filter((r) =>
    qmatch(r, ['name', 'specialty', 'city'], q),
  )
  const medicines = (db.prepare('SELECT * FROM medicines').all() as Row[]).filter((r) =>
    qmatch(r, ['name', 'generic_name'], q),
  )
  const facilities = (db.prepare('SELECT * FROM hospitals').all() as Row[]).filter((r) =>
    qmatch(r, ['name', 'services', 'city'], q),
  )
  const laboratories = (db.prepare('SELECT * FROM laboratories').all() as Row[]).filter((r) =>
    qmatch(r, ['name', 'tests', 'city'], q),
  )
  const imaging = (db.prepare('SELECT * FROM imaging_centers').all() as Row[]).filter((r) =>
    qmatch(r, ['name', 'exams', 'city'], q),
  )
  const nurses = (db.prepare('SELECT * FROM nurses').all() as Row[]).filter((r) =>
    qmatch(r, ['name', 'services', 'city'], q),
  )

  const mapMedicine = (r: Row) => ({
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
    available: r.available === 1,
    prescriptionRequired: r.prescription_required === 1,
  })

  const results = {
    query: q,
    category,
    doctors: doctors.map((r) => ({
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
    })),
    medicines: medicines.map(mapMedicine),
    facilities: facilities.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      sector: r.sector,
      location: r.location,
      city: r.city,
      services: parse(r.services as string),
      openingHours: r.opening_hours,
      emergencyAvailable: r.emergency_available === 1,
      phone: r.phone,
      rating: r.rating,
      description: r.description,
    })),
    laboratories: laboratories.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      city: r.city,
      tests: parse(r.tests as string),
      openingHours: r.opening_hours,
      phone: r.phone,
      rating: r.rating,
    })),
    imaging: imaging.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      city: r.city,
      exams: parse(r.exams as string),
      openingHours: r.opening_hours,
      phone: r.phone,
      rating: r.rating,
    })),
    nurses: nurses.map((r) => ({
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
    })),
  }

  const total =
    results.doctors.length +
    results.medicines.length +
    results.facilities.length +
    results.laboratories.length +
    results.imaging.length +
    results.nurses.length

  res.json({ ...results, total })
})