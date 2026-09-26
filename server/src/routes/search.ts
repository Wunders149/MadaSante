import { Router } from 'express'
import type { Request, Response } from 'express'
import { db } from '../db.js'

export const searchRouter = Router()

type Row = Record<string, unknown>

const parse = (value: unknown) => {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const bool = (value: unknown) => value === 1

/**
 * One searchable table.
 *
 * `fields` are matched with ILIKE against the lower-cased needle. JSON columns
 * (`services`, `tests`, `exams`) are stored as text, so they are searched as
 * text too — the same trick the previous implementation relied on when it
 * filtered in JavaScript, but now it happens in the database.
 */
type Target = {
  key: string
  table: string
  fields: string[]
  /**
   * Ordering expression. Not every catalog table has a `rating` — `medicines`
   * has none — so this is per target rather than a shared default.
   */
  order: string
  /** Maps a row to the API shape. */
  map: (r: Row) => unknown
}

const TARGETS: Target[] = [
  {
    key: 'doctors',
    table: 'doctors',
    fields: ['name', 'specialty', 'city', 'description', 'languages'],
    order: 'rating DESC NULLS LAST, name',
    map: (r) => ({
      id: r.id,
      name: r.name,
      specialty: r.specialty,
      type: r.type,
      location: r.location,
      city: r.city,
      consultationTypes: parse(r.consultation_types),
      price: r.price,
      priceHome: r.price_home == null ? undefined : r.price_home,
      availability: parse(r.availability),
      availabilitySlots: parse(r.availability_slots),
      photo: r.photo,
      rating: r.rating,
      reviews: r.reviews,
      description: r.description,
      languages: parse(r.languages),
    }),
  },
  {
    key: 'medicines',
    table: 'medicines',
    fields: ['name', 'generic_name', 'pharmacy_name', 'city'],
    order: 'name',
    map: (r) => ({
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
      available: bool(r.available),
      prescriptionRequired: bool(r.prescription_required),
    }),
  },
  {
    key: 'facilities',
    table: 'hospitals',
    fields: ['name', 'type', 'city', 'services', 'description'],
    order: 'rating DESC NULLS LAST, name',
    map: (r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      sector: r.sector,
      location: r.location,
      city: r.city,
      services: parse(r.services),
      openingHours: r.opening_hours,
      emergencyAvailable: bool(r.emergency_available),
      phone: r.phone,
      rating: r.rating,
      description: r.description,
    }),
  },
  {
    key: 'laboratories',
    table: 'laboratories',
    fields: ['name', 'city', 'tests'],
    order: 'rating DESC NULLS LAST, name',
    map: (r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      city: r.city,
      tests: parse(r.tests),
      openingHours: r.opening_hours,
      phone: r.phone,
      rating: r.rating,
    }),
  },
  {
    key: 'imaging',
    table: 'imaging_centers',
    fields: ['name', 'city', 'exams'],
    order: 'rating DESC NULLS LAST, name',
    map: (r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      city: r.city,
      exams: parse(r.exams),
      openingHours: r.opening_hours,
      phone: r.phone,
      rating: r.rating,
    }),
  },
  {
    key: 'nurses',
    table: 'nurses',
    fields: ['name', 'qualification', 'city', 'services'],
    order: 'rating DESC NULLS LAST, name',
    map: (r) => ({
      id: r.id,
      name: r.name,
      qualification: r.qualification,
      location: r.location,
      city: r.city,
      services: parse(r.services),
      availability: parse(r.availability),
      price: r.price,
      photo: r.photo,
      rating: r.rating,
    }),
  },
  {
    key: 'practitioners',
    table: 'practitioners',
    fields: ['name', 'specialty', 'qualification', 'city', 'services', 'languages'],
    order: 'rating DESC NULLS LAST, name',
    map: (r) => ({
      id: r.id,
      profession: r.profession,
      name: r.name,
      qualification: r.qualification,
      specialty: r.specialty,
      location: r.location,
      city: r.city,
      services: parse(r.services),
      languages: parse(r.languages),
      consultationTypes: parse(r.consultation_types),
      price: r.price,
      priceHome: r.price_home == null ? undefined : r.price_home,
      availabilitySlots: parse(r.availability_slots),
      photo: r.photo,
      rating: r.rating,
      reviews: r.reviews,
      description: r.description,
    }),
  },
  {
    key: 'ngos',
    table: 'medical_ngos',
    fields: ['name', 'focus', 'city', 'services', 'coverage', 'description'],
    order: 'rating DESC NULLS LAST, name',
    map: (r) => ({
      id: r.id,
      name: r.name,
      focus: r.focus,
      location: r.location,
      city: r.city,
      services: parse(r.services),
      coverage: parse(r.coverage),
      openingHours: r.opening_hours,
      phone: r.phone,
      email: r.email ?? undefined,
      website: r.website ?? undefined,
      freeCare: bool(r.free_care),
      rating: r.rating,
      description: r.description,
    }),
  },
]

/** Result rows returned per category, so one broad query cannot flood the UI. */
const PER_CATEGORY = 20

/**
 * Cross-category search.
 *
 * Previously this ran an unindexed `SELECT *` against every table, filtered the
 * results in JavaScript, and accepted a `category` parameter that it echoed
 * back but never applied. Filtering now happens in Postgres via ILIKE, the
 * category is honoured, and each bucket is capped.
 */
searchRouter.get('/search', async (req: Request, res: Response) => {
  const raw = String(req.query.q ?? '').trim()
  const category = String(req.query.category ?? 'all')

  const buckets: Record<string, unknown[]> = Object.fromEntries(TARGETS.map((t) => [t.key, []]))

  if (!raw) {
    res.json({ query: '', category, ...buckets, total: 0 })
    return
  }

  // Bound the needle so a very long string cannot be pushed into 8 LIKE
  // patterns, and escape the LIKE metacharacters so a user typing `%` searches
  // for a literal percent sign instead of matching everything.
  const needle = raw.slice(0, 120).replace(/[\\%_]/g, (c) => `\\${c}`)
  const selected = category === 'all' ? TARGETS : TARGETS.filter((t) => t.key === category)

  await Promise.all(
    selected.map(async (target) => {
      // Placeholders are numbered by push order, so the array must start empty:
      // seeding it with a bare needle would leave $1 unreferenced and Postgres
      // would reject the statement with "could not determine data type".
      const params: unknown[] = []
      const predicate = target.fields
        .map((field) => {
          params.push(`%${needle}%`)
          return `LOWER(COALESCE(${field}, '')) LIKE $${params.length} ESCAPE '\\'`
        })
        .join(' OR ')
      const rows = (
        await db.query(
          `SELECT * FROM ${target.table} WHERE ${predicate} ORDER BY ${target.order} LIMIT ${PER_CATEGORY}`,
          params,
        )
      ).rows as Row[]
      buckets[target.key] = rows.map(target.map)
    }),
  )

  const total = Object.values(buckets).reduce((sum, list) => sum + list.length, 0)
  res.json({ query: raw, category, ...buckets, total })
})
