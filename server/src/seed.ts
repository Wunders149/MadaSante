import bcrypt from 'bcryptjs'
import { db } from './db.js'
import {
  currentPatient,
  providerUsers,
  doctors,
  hospitals,
  pharmacies,
  medicines,
  laboratories,
  imagingCenters,
  nurses,
  ambulances,
  initialAppointments,
  initialPayments,
  initialNotifications,
  initialDeliveries,
} from './seed-data.js'

const json = (value: unknown) => JSON.stringify(value)
const bool = (value: boolean) => (value ? 1 : 0)

function insertUsers() {
  const stmt = db.prepare(`
    INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, photo, provider_id)
    VALUES (@id, @firstName, @lastName, @phone, @email, @passwordHash, @role, @location, @photo, @providerId)
  `)
  const hash = bcrypt.hashSync('demo', 10)

  stmt.run({
    id: currentPatient.id,
    firstName: currentPatient.firstName,
    lastName: currentPatient.lastName,
    phone: currentPatient.phone,
    email: currentPatient.email,
    passwordHash: hash,
    role: 'patient',
    location: currentPatient.location,
    photo: null,
    providerId: null,
  })

  for (const p of providerUsers) {
    stmt.run({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      email: p.email,
      passwordHash: hash,
      role: p.role,
      location: p.location,
      photo: null,
      providerId: p.providerId,
    })
  }
}

function insertCatalog() {
  const doctorStmt = db.prepare(`
    INSERT INTO doctors (id, name, specialty, type, location, city, consultation_types, price, price_home, availability, availability_slots, photo, rating, reviews, description, languages)
    VALUES (@id, @name, @specialty, @type, @location, @city, @consultationTypes, @price, @priceHome, @availability, @availabilitySlots, @photo, @rating, @reviews, @description, @languages)
  `)
  for (const d of doctors) {
    doctorStmt.run({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      type: d.type,
      location: d.location,
      city: d.city,
      consultationTypes: json(d.consultationTypes),
      price: d.price,
      priceHome: d.priceHome ?? null,
      availability: json(d.availability),
      availabilitySlots: json(d.availabilitySlots),
      photo: d.photo,
      rating: d.rating,
      reviews: d.reviews,
      description: d.description,
      languages: json(d.languages),
    })
  }

  const hospitalStmt = db.prepare(`
    INSERT INTO hospitals (id, name, type, sector, location, city, services, opening_hours, emergency_available, phone, rating, description)
    VALUES (@id, @name, @type, @sector, @location, @city, @services, @openingHours, @emergencyAvailable, @phone, @rating, @description)
  `)
  for (const h of hospitals) {
    hospitalStmt.run({
      id: h.id,
      name: h.name,
      type: h.type,
      sector: h.sector,
      location: h.location,
      city: h.city,
      services: json(h.services),
      openingHours: h.openingHours,
      emergencyAvailable: bool(h.emergencyAvailable),
      phone: h.phone,
      rating: h.rating,
      description: h.description,
    })
  }

  const pharmacyStmt = db.prepare(`
    INSERT INTO pharmacies (id, name, location, city, phone, opening_hours, delivery_available, rating)
    VALUES (@id, @name, @location, @city, @phone, @openingHours, @deliveryAvailable, @rating)
  `)
  for (const p of pharmacies) pharmacyStmt.run({ ...p, openingHours: p.openingHours, deliveryAvailable: bool(p.deliveryAvailable) })

  const medicineStmt = db.prepare(`
    INSERT INTO medicines (id, name, generic_name, form, dose, price, pharmacy_id, pharmacy_name, location, city, stock, available, prescription_required)
    VALUES (@id, @name, @genericName, @form, @dose, @price, @pharmacyId, @pharmacyName, @location, @city, @stock, @available, @prescriptionRequired)
  `)
  for (const m of medicines) {
    medicineStmt.run({
      id: m.id,
      name: m.name,
      genericName: m.genericName,
      form: m.form,
      dose: m.dose,
      price: m.price,
      pharmacyId: m.pharmacyId,
      pharmacyName: m.pharmacyName,
      location: m.location,
      city: m.city,
      stock: m.stock,
      available: bool(m.available),
      prescriptionRequired: bool(m.prescriptionRequired),
    })
  }

  const labStmt = db.prepare(`
    INSERT INTO laboratories (id, name, location, city, tests, opening_hours, phone, rating)
    VALUES (@id, @name, @location, @city, @tests, @openingHours, @phone, @rating)
  `)
  for (const l of laboratories) labStmt.run({ ...l, tests: json(l.tests), openingHours: l.openingHours })

  const imagingStmt = db.prepare(`
    INSERT INTO imaging_centers (id, name, location, city, exams, opening_hours, phone, rating)
    VALUES (@id, @name, @location, @city, @exams, @openingHours, @phone, @rating)
  `)
  for (const c of imagingCenters) imagingStmt.run({ ...c, exams: json(c.exams), openingHours: c.openingHours })

  const nurseStmt = db.prepare(`
    INSERT INTO nurses (id, name, qualification, location, city, services, availability, price, photo, rating)
    VALUES (@id, @name, @qualification, @location, @city, @services, @availability, @price, @photo, @rating)
  `)
  for (const n of nurses) nurseStmt.run({ ...n, services: json(n.services), availability: json(n.availability) })

  const ambulanceStmt = db.prepare(`
    INSERT INTO ambulances (id, provider, location, city, phone, vehicles, available, response_time)
    VALUES (@id, @provider, @location, @city, @phone, @vehicles, @available, @responseTime)
  `)
  for (const a of ambulances) {
    ambulanceStmt.run({ ...a, vehicles: json(a.vehicles), available: bool(a.available), responseTime: a.responseTime })
  }
}

function insertAccord() {
  const appointmentStmt = db.prepare(`
    INSERT INTO appointments (id, reference, patient_id, provider_id, provider_type, provider_name, provider_photo, type, date, time, location, status, price, payment_status)
    VALUES (@id, @reference, @patientId, @providerId, @providerType, @providerName, @providerPhoto, @type, @date, @time, @location, @status, @price, @paymentStatus)
  `)
  for (const a of initialAppointments) {
    appointmentStmt.run({ ...a, providerPhoto: a.providerPhoto ?? null })
  }

  const paymentStmt = db.prepare(`
    INSERT INTO payments (id, reference, patient_id, provider_id, service, provider_name, date, amount, method, status, breakdown)
    VALUES (@id, @reference, @patientId, @providerId, @service, @providerName, @date, @amount, @method, @status, @breakdown)
  `)
  for (const p of initialPayments) paymentStmt.run({ ...p, breakdown: json(p.breakdown) })

  const notificationStmt = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, category, read, created_at, link)
    VALUES (@id, @userId, @title, @message, @category, @read, @createdAt, @link)
  `)
  for (const n of initialNotifications) {
    notificationStmt.run({ ...n, read: n.read ? 1 : 0, link: n.link ?? null })
  }

  const deliveryStmt = db.prepare(`
    INSERT INTO delivery_orders (id, reference, patient_id, medicine_id, medicine_name, dose, quantity, pharmacy_id, pharmacy_name, delivery_address, delivery_time_slot, delivery_fee, total, status, date)
    VALUES (@id, @reference, @patientId, @medicineId, @medicineName, @dose, @quantity, @pharmacyId, @pharmacyName, @deliveryAddress, @deliveryTimeSlot, @deliveryFee, @total, @status, @date)
  `)
  for (const d of initialDeliveries) deliveryStmt.run(d)
}

export function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }
  if (count.n > 0) return
  const run = db.transaction(() => {
    insertUsers()
    insertCatalog()
    insertAccord()
  })
  run()
}