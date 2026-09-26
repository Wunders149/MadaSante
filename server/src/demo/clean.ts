/**
 * Demo data remover — development only.
 *
 * Run with `npm run seed:demo -- --clean`, or preview with `--dry-run`.
 *
 * The hard requirement is that this removes *only* rows the demo created and
 * never touches anything else in the database. Two things make that non-trivial:
 *
 *  1. Catalog ids come from the fixture list, but approving a demo provider
 *     application also creates a catalog record with a generated id
 *     (`uniqueId('pr_<role>')`). Those are recovered by walking
 *     `provider_applications` -> `users` rather than by guessing prefixes.
 *  2. Deletion has to follow the dependency order, because appointments,
 *     payments and deliveries all point at the users and catalog rows.
 *
 * Rows created outside the demo (real providers, real patients, the super
 * admin) are never referenced by any of these id sets, so they survive.
 */
import { config } from '../config.js'
import { db } from '../db.js'
import { PROVIDER_TABLE } from '../catalog.js'
import * as d from './data.js'

type Plan = {
  catalog: Map<string, Set<string>> // table -> ids
  users: Set<string>
  userEmails: Set<string>
  applications: Set<string>
  appointments: Set<string>
  notifications: Set<string>
  payments: Set<string>
  deliveries: Set<string>
  availabilityProviders: Set<string>
}

const add = (set: Set<string>, value: unknown) => {
  if (typeof value === 'string' && value) set.add(value)
}

async function buildPlan(): Promise<Plan> {
  const plan: Plan = {
    catalog: new Map(),
    users: new Set(),
    userEmails: new Set(),
    applications: new Set(),
    appointments: new Set(),
    notifications: new Set(),
    payments: new Set(),
    deliveries: new Set(),
    availabilityProviders: new Set(),
  }
  const put = (table: string, id: unknown) => {
    if (typeof id !== 'string' || !id) return
    if (!plan.catalog.has(table)) plan.catalog.set(table, new Set())
    plan.catalog.get(table)!.add(id)
  }

  // --- ids that come straight from the fixture file -----------------------
  d.doctors.forEach((x) => put('doctors', x.id))
  d.hospitals.forEach((x) => put('hospitals', x.id))
  d.pharmacies.forEach((x) => put('pharmacies', x.id))
  d.medicines.forEach((x) => put('medicines', x.id))
  d.laboratories.forEach((x) => put('laboratories', x.id))
  d.imagingCenters.forEach((x) => put('imaging_centers', x.id))
  d.nurses.forEach((x) => put('nurses', x.id))
  d.ambulances.forEach((x) => put('ambulances', x.id))
  d.practitioners.forEach((x) => put('practitioners', x.id))
  d.medicalNgos.forEach((x) => put('medical_ngos', x.id))
  d.appointments.forEach((x) => plan.appointments.add(x.id))
  d.payments.forEach((x) => plan.payments.add(x.id))
  d.deliveries.forEach((x) => plan.deliveries.add(x.id))
  d.notifications.forEach((x) => plan.notifications.add(x.id))
  d.pendingApplications.forEach((x) => plan.applications.add(x.id))
  add(plan.users, d.adminUser.id)
  add(plan.userEmails, d.adminUser.email)
  d.patientUsers.forEach((p) => { add(plan.users, p.id); add(plan.userEmails, p.email) })
  d.providerUsers.forEach((p) => {
    add(plan.users, p.id)
    add(plan.userEmails, p.email)
    add(plan.availabilityProviders, p.providerId)
  })

  // --- ids created as a *consequence* of approving a demo application ------
  // Approving `pa_demo_*` created a users row and a catalog record with
  // generated ids, so they are recovered by following the application.
  const apps = (
    await db.query(
      `SELECT a.id, a.role, a.email, u.id AS user_id, u.provider_id
         FROM provider_applications a
         LEFT JOIN users u ON u.email = a.email
        WHERE a.id LIKE 'pa_demo_%'`,
    )
  ).rows as Array<{ id: string; role: string; email: string; user_id: string | null; provider_id: string | null }>

  for (const app of apps) {
    plan.applications.add(app.id)
    plan.userEmails.add(app.email)
    if (app.user_id) plan.users.add(app.user_id)
    if (app.provider_id) {
      const table = PROVIDER_TABLE[app.role]?.table
      if (table) put(table, app.provider_id)
    }
  }

  // Anything those accounts own (bookings, payments, deliveries, alerts).
  if (plan.users.size > 0) {
    const list = [...plan.users]
    const more = await db.query(
      `SELECT id FROM appointments WHERE patient_id = ANY($1) OR provider_id = ANY($1)`,
      [list],
    )
    for (const r of more.rows) plan.appointments.add(r.id)
    const pays = await db.query(`SELECT id FROM payments WHERE patient_id = ANY($1) OR provider_id = ANY($1)`, [list])
    for (const r of pays.rows) plan.payments.add(r.id)
    const dels = await db.query(`SELECT id FROM delivery_orders WHERE patient_id = ANY($1)`, [list])
    for (const r of dels.rows) plan.deliveries.add(r.id)
    const notes = await db.query(`SELECT id FROM notifications WHERE user_id = ANY($1)`, [list])
    for (const r of notes.rows) plan.notifications.add(r.id)
  }

  return plan
}

type Step = { label: string; sql: string; params: unknown[]; count: number }

export async function cleanDemo(dryRun: boolean) {
  if (config.isProduction && !dryRun) {
    console.error('[seed:clean] Refusing to delete with NODE_ENV=production. Pass --dry-run to inspect instead.')
    process.exit(1)
  }

  const plan = await buildPlan()
  const userList = [...plan.users]
  const steps: Step[] = [
    { label: 'notifications', sql: 'DELETE FROM notifications WHERE id = ANY($1)', params: [[...plan.notifications]], count: plan.notifications.size },
    { label: 'payments', sql: 'DELETE FROM payments WHERE id = ANY($1)', params: [[...plan.payments]], count: plan.payments.size },
    { label: 'delivery_orders', sql: 'DELETE FROM delivery_orders WHERE id = ANY($1)', params: [[...plan.deliveries]], count: plan.deliveries.size },
    { label: 'appointments', sql: 'DELETE FROM appointments WHERE id = ANY($1)', params: [[...plan.appointments]], count: plan.appointments.size },
    { label: 'availability', sql: 'DELETE FROM availability WHERE provider_id = ANY($1)', params: [[...plan.availabilityProviders]], count: plan.availabilityProviders.size },
    { label: 'users', sql: 'DELETE FROM users WHERE id = ANY($1) OR email = ANY($2)', params: [userList, [...plan.userEmails]], count: plan.users.size },
  ]
  for (const [table, ids] of plan.catalog) {
    steps.push({ label: table, sql: `DELETE FROM ${table} WHERE id = ANY($1)`, params: [[...ids]], count: ids.size })
  }
  steps.push({
    label: 'provider_documents',
    sql: 'DELETE FROM provider_documents WHERE application_id = ANY($1)',
    params: [[...plan.applications]],
    count: plan.applications.size,
  })
  steps.push({
    label: 'provider_applications',
    sql: 'DELETE FROM provider_applications WHERE id = ANY($1)',
    params: [[...plan.applications]],
    count: plan.applications.size,
  })

  console.log(`[seed:clean] ${dryRun ? 'DRY RUN — nothing will be deleted.' : 'Removing demo rows.'}`)
  console.log(`[seed:clean] demo applications found: ${plan.applications.size}`)
  console.log(`[seed:clean] demo accounts found:      ${plan.userEmails.size}`)
  console.log('')

  const client = await db.connect()
  let removed = 0
  try {
    await client.query('BEGIN')
    for (const step of steps) {
      if (step.count === 0) continue
      const res = await client.query(step.sql, step.params)
      removed += res.rowCount ?? 0
      console.log(`  ${dryRun ? 'would delete' : 'deleted'}  ${String(res.rowCount ?? 0).padStart(4)}  ${step.label}`)
    }
    if (dryRun) {
      await client.query('ROLLBACK')
    } else {
      await client.query('COMMIT')
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  if (dryRun) {
    console.log('\n[seed:clean] Dry run complete. Re-run without --dry-run to apply.')
  } else {
    console.log(`\n[seed:clean] Removed ${removed} row(s). Accounts not created by the demo were left untouched.`)
  }
  return removed
}
