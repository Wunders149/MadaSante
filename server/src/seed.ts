import bcrypt from 'bcryptjs'
import { db } from './db.js'
import {
  currentPatient,
  adminUser,
  providerUsers,
  pendingApplications,
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

  stmt.run({
    id: adminUser.id,
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    phone: adminUser.phone,
    email: adminUser.email,
    passwordHash: hash,
    role: 'admin',
    location: adminUser.location,
    photo: null,
    providerId: null,
  })
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

function insertApplications() {
  const appStmt = db.prepare(`
    INSERT INTO provider_applications (id, reference, role, org_name, first_name, last_name, phone, email, location, city, license_number, password_hash, status, review_note, reviewed_at, created_at)
    VALUES (@id, @reference, @role, @orgName, @firstName, @lastName, @phone, @email, @location, @city, @licenseNumber, @passwordHash, @status, @reviewNote, @reviewedAt, @createdAt)
  `)
  const docStmt = db.prepare(`
    INSERT INTO provider_documents (id, application_id, doc_type, file_name, mime, data)
    VALUES (@id, @applicationId, @docType, @fileName, @mime, @data)
  `)
  const appHash = bcrypt.hashSync('demo', 10)
  for (const a of pendingApplications) {
    appStmt.run({
      id: a.id,
      reference: a.reference,
      role: a.role,
      orgName: a.orgName,
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      email: a.email,
      location: a.location,
      city: a.city,
      licenseNumber: a.licenseNumber,
      passwordHash: appHash,
      status: a.status,
      reviewNote: a.reviewNote ?? null,
      reviewedAt: a.reviewedAt ?? null,
      createdAt: a.createdAt,
    })
    for (let i = 0; i < a.documents.length; i++) {
      const d = a.documents[i]
      docStmt.run({
        id: `${a.id}_doc_${i + 1}`,
        applicationId: a.id,
        docType: d.docType,
        fileName: d.fileName,
        mime: d.mime,
        data: d.data,
      })
    }
  }
}

function insertAdminIfMissing() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminUser.email)
  if (existing) return
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, photo, provider_id)
    VALUES (?, ?, ?, ?, ?, ?, 'admin', ?, NULL, NULL)
  `).run(
    adminUser.id,
    adminUser.firstName,
    adminUser.lastName,
    adminUser.phone,
    adminUser.email,
    bcrypt.hashSync('demo', 10),
    adminUser.location,
  )
}

function insertApplicationsIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM provider_applications').get() as { n: number }
  if (count.n > 0) return
  const appStmt = db.prepare(`
    INSERT INTO provider_applications (id, reference, role, org_name, first_name, last_name, phone, email, location, city, license_number, password_hash, status, review_note, reviewed_at, created_at)
    VALUES (@id, @reference, @role, @orgName, @firstName, @lastName, @phone, @email, @location, @city, @licenseNumber, @passwordHash, @status, @reviewNote, @reviewedAt, @createdAt)
  `)
  const docStmt = db.prepare(`
    INSERT INTO provider_documents (id, application_id, doc_type, file_name, mime, data)
    VALUES (@id, @applicationId, @docType, @fileName, @mime, @data)
  `)
  const appHash = bcrypt.hashSync('demo', 10)
  for (const a of pendingApplications) {
    appStmt.run({
      id: a.id,
      reference: a.reference,
      role: a.role,
      orgName: a.orgName,
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      email: a.email,
      location: a.location,
      city: a.city,
      licenseNumber: a.licenseNumber,
      passwordHash: appHash,
      status: a.status,
      reviewNote: a.reviewNote ?? null,
      reviewedAt: a.reviewedAt ?? null,
      createdAt: a.createdAt,
    })
    for (let i = 0; i < a.documents.length; i++) {
      const d = a.documents[i]
      docStmt.run({
        id: `${a.id}_doc_${i + 1}`,
        applicationId: a.id,
        docType: d.docType,
        fileName: d.fileName,
        mime: d.mime,
        data: d.data,
      })
    }
  }
}

export function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }
  if (count.n === 0) {
    const run = db.transaction(() => {
      insertUsers()
      insertCatalog()
      insertAccord()
      insertApplications()
    })
    run()
  }
  const extra = db.transaction(() => {
    insertAdminIfMissing()
    insertApplicationsIfEmpty()
  })
  extra()
}