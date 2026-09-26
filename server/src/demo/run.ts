/**
 * Demo data loader — development only.
 *
 * Run with `npm run seed:demo`. It is deliberately NOT part of `npm start`, so
 * a production deploy cannot load fixtures even if the environment is
 * misconfigured; the guard below is a second line of defence.
 *
 * Every insert is `ON CONFLICT (id) DO NOTHING`, so re-running tops the catalog
 * up rather than duplicating or failing.
 */
import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { db, migrate } from '../db.js'
import * as d from './data.js'

const json = (value: unknown) => JSON.stringify(value)

/** Insert helper: `ON CONFLICT (id) DO NOTHING` keeps the seed re-runnable. */
async function insertMany(
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
  onConflict = 'id',
) {
  if (rows.length === 0) return
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    for (const row of rows) {
      const values = columns.map((c) => row[c] ?? null)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
      const conflict = onConflict === 'id' ? 'id' : onConflict
      await client.query(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
         ON CONFLICT (${conflict}) DO NOTHING`,
        values,
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const USER_COLUMNS = ['id', 'first_name', 'last_name', 'phone', 'email', 'password_hash', 'role', 'location', 'photo', 'provider_id']

async function seedUsers(hash: string) {
  const rows = [
    {
      id: d.adminUser.id, first_name: d.adminUser.firstName, last_name: d.adminUser.lastName,
      phone: d.adminUser.phone, email: d.adminUser.email, password_hash: hash,
      role: 'admin', location: d.adminUser.location, photo: null, provider_id: null,
    },
    ...d.patientUsers.map((p) => ({
      id: p.id, first_name: p.firstName, last_name: p.lastName, phone: p.phone, email: p.email,
      password_hash: hash, role: 'patient', location: p.location, photo: null, provider_id: null,
    })),
    ...d.providerUsers.map((p) => ({
      id: p.id, first_name: p.firstName, last_name: p.lastName, phone: p.phone, email: p.email,
      password_hash: hash, role: p.role, location: p.location, photo: null, provider_id: p.providerId,
    })),
  ]
  await insertMany('users', USER_COLUMNS, rows, 'email')
}

async function main() {
  if (config.isProduction) {
    console.error('[seed:demo] Refusing to run with NODE_ENV=production. Demo data is for local development only.')
    process.exit(1)
  }
  if (!config.databaseUrl) {
    console.error('[seed:demo] DATABASE_URL is not set.')
    process.exit(1)
  }

  console.log('[seed:demo] Applying schema…')
  await migrate()

  const hash = bcrypt.hashSync(d.DEMO_PASSWORD, 10)

  console.log('[seed:demo] Users…')
  await seedUsers(hash)

  console.log('[seed:demo] Catalog…')
  await insertMany('doctors', [
    'id', 'name', 'specialty', 'type', 'location', 'city', 'consultation_types', 'price', 'price_home',
    'availability', 'availability_slots', 'photo', 'rating', 'reviews', 'description', 'languages',
  ], d.doctors.map((x) => ({
    ...x,
    consultation_types: json(x.consultation_types),
    availability: json(x.availability),
    availability_slots: json(x.availability_slots),
    languages: json(x.languages),
    photo: null,
  })))

  await insertMany('hospitals', [
    'id', 'name', 'type', 'sector', 'location', 'city', 'services', 'opening_hours',
    'emergency_available', 'phone', 'rating', 'description',
  ], d.hospitals.map((x) => ({ ...x, services: json(x.services) })))

  await insertMany('pharmacies', [
    'id', 'name', 'location', 'city', 'phone', 'opening_hours', 'delivery_available', 'rating',
  ], d.pharmacies)

  await insertMany('medicines', [
    'id', 'name', 'generic_name', 'form', 'dose', 'price', 'pharmacy_id', 'pharmacy_name',
    'location', 'city', 'stock', 'available', 'prescription_required',
  ], d.medicines)

  await insertMany('laboratories', ['id', 'name', 'location', 'city', 'tests', 'opening_hours', 'phone', 'rating'],
    d.laboratories.map((x) => ({ ...x, tests: json(x.tests) })))

  await insertMany('imaging_centers', ['id', 'name', 'location', 'city', 'exams', 'opening_hours', 'phone', 'rating'],
    d.imagingCenters.map((x) => ({ ...x, exams: json(x.exams) })))

  await insertMany('nurses', ['id', 'name', 'qualification', 'location', 'city', 'services', 'availability', 'price', 'photo', 'rating'],
    d.nurses.map((x) => ({ ...x, services: json(x.services), availability: json(x.availability), photo: null })))

  await insertMany('ambulances', ['id', 'provider', 'location', 'city', 'phone', 'vehicles', 'available', 'response_time'],
    d.ambulances.map((x) => ({ ...x, vehicles: json(x.vehicles) })))

  await insertMany('practitioners', [
    'id', 'profession', 'name', 'qualification', 'specialty', 'location', 'city', 'services',
    'languages', 'consultation_types', 'price', 'price_home', 'availability_slots', 'photo',
    'rating', 'reviews', 'description',
  ], d.practitioners.map((x) => ({
    ...x,
    services: json(x.services),
    languages: json(x.languages),
    consultation_types: json(x.consultation_types),
    availability_slots: json(d.doctors[0].availability_slots),
    photo: null,
  })))

  await insertMany('medical_ngos', [
    'id', 'name', 'focus', 'location', 'city', 'services', 'coverage', 'opening_hours',
    'phone', 'email', 'website', 'free_care', 'rating', 'description',
  ], d.medicalNgos.map((x) => ({ ...x, services: json(x.services), coverage: json(x.coverage), website: x.website || null })))

  console.log('[seed:demo] Activity…')
  await insertMany('appointments', [
    'id', 'reference', 'patient_id', 'provider_id', 'provider_type', 'provider_name', 'provider_photo',
    'type', 'consultation_type', 'date', 'time', 'location', 'status', 'price', 'base_price', 'payment_status',
  ], d.appointments.map((x) => ({ ...x, provider_photo: null })))

  await insertMany('payments', [
    'id', 'reference', 'patient_id', 'provider_id', 'appointment_id', 'service', 'provider_name',
    'date', 'amount', 'method', 'status', 'breakdown',
  ], d.payments.map((x) => ({ ...x, breakdown: json(x.breakdown) })))

  await insertMany('delivery_orders', [
    'id', 'reference', 'patient_id', 'medicine_id', 'medicine_name', 'dose', 'quantity',
    'pharmacy_id', 'pharmacy_name', 'delivery_address', 'delivery_time_slot', 'delivery_fee',
    'total', 'status', 'date',
  ], d.deliveries)

  await insertMany('notifications', ['id', 'user_id', 'title', 'message', 'category', 'read', 'created_at', 'link'],
    d.notifications)

  await insertMany('provider_applications', [
    'id', 'reference', 'role', 'org_name', 'first_name', 'last_name', 'phone', 'email',
    'location', 'city', 'license_number', 'password_hash', 'status', 'review_note', 'reviewed_at', 'created_at',
  ], d.pendingApplications.map((x) => ({ ...x, password_hash: hash, status: 'pending', review_note: null, reviewed_at: null, created_at: new Date().toISOString() })))

  // Give the demo doctor a published availability grid so the provider console
  // does not look empty on first login.
  const slots = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam'].flatMap((day) =>
    ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map((slot) => ({
      provider_id: 'd1', day, slot, available: 1,
    })),
  )
  for (const row of slots) {
    await db.query(
      `INSERT INTO availability (provider_id, day, slot, available) VALUES (?, ?, ?, ?)
       ON CONFLICT (provider_id, day, slot) DO NOTHING`,
      [row.provider_id, row.day, row.slot, row.available],
    )
  }

  const summary = (await db.query(`
    SELECT
      (SELECT COUNT(*) FROM doctors)::int            AS doctors,
      (SELECT COUNT(*) FROM hospitals)::int          AS hospitals,
      (SELECT COUNT(*) FROM pharmacies)::int         AS pharmacies,
      (SELECT COUNT(*) FROM medicines)::int          AS medicines,
      (SELECT COUNT(*) FROM laboratories)::int       AS laboratories,
      (SELECT COUNT(*) FROM imaging_centers)::int    AS imaging,
      (SELECT COUNT(*) FROM nurses)::int             AS nurses,
      (SELECT COUNT(*) FROM ambulances)::int         AS ambulances,
      (SELECT COUNT(*) FROM practitioners)::int      AS practitioners,
      (SELECT COUNT(*) FROM medical_ngos)::int       AS ngos,
      (SELECT COUNT(*) FROM users)::int              AS users,
      (SELECT COUNT(*) FROM appointments)::int       AS appointments,
      (SELECT COUNT(*) FROM payments)::int           AS payments,
      (SELECT COUNT(*) FROM provider_applications)::int AS applications
  `)).rows[0] as Record<string, number>

  console.log('\n[seed:demo] Done. Catalog:')
  for (const [key, value] of Object.entries(summary)) {
    console.log(`  ${key.padEnd(14)} ${value}`)
  }
  console.log(`\n[seed:demo] All demo accounts use the password: ${d.DEMO_PASSWORD}`)
  console.log('[seed:demo]   admin@demo.mg            (super admin)')
  console.log('[seed:demo]   dr.rakoto@demo.mg        (doctor)')
  console.log('[seed:demo]   kine.rasoanaivo@demo.mg  (physiotherapist)')
  console.log('[seed:demo]   psy.andrianina@demo.mg   (psychologist)')
  console.log('[seed:demo]   contact@santemada.mg     (medical NGO)')
  console.log('[seed:demo]   voahangy@demo.mg         (patient)')
  console.log('\n[seed:demo] Re-running is safe: inserts are ON CONFLICT DO NOTHING.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[seed:demo] Failed:', err)
  process.exit(1)
})
