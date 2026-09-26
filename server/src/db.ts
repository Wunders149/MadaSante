import pg from 'pg'
import type { QueryResult } from 'pg'
import { config } from './config.js'

// Supabase (and most managed Postgres providers) require TLS.
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.pgSsl ? { rejectUnauthorized: false } : false,
})

/** Convert SQLite-style `?` placeholders to Postgres `$1..$n`. */
function toPgSql(text: string): string {
  let i = 0
  return text.replace(/\?/g, () => `$${++i}`)
}

/**
 * Client returned by `db.connect()`.
 *
 * It behaves like a pooled pg client, but `query()` always runs through
 * `toPgSql` first, so transaction code can use the same SQLite-style `?`
 * placeholders as `db.query`. Raw `client.query('... ?')` used to hit
 * Postgres unconverted and blow up with `syntax error at or near "?"`.
 */
export type DbClient = {
  query: (text: string, params?: unknown[]) => Promise<QueryResult>
  release: (err?: Error | boolean) => void
}

export const db = {
  query: (text: string, params: unknown[] = []) => pool.query(toPgSql(text), params),
  connect: async (): Promise<DbClient> => {
    const client = await pool.connect()
    return {
      query: (text, params = []) => client.query(toPgSql(text), params),
      release: (err) => client.release(err),
    }
  },
}

export async function migrate() {
  return db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      location TEXT,
      photo TEXT,
      provider_id TEXT
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      consultation_types TEXT NOT NULL,
      price INT NOT NULL,
      price_home INT,
      availability TEXT NOT NULL,
      availability_slots TEXT NOT NULL,
      photo TEXT,
      rating DOUBLE PRECISION NOT NULL,
      reviews INT NOT NULL,
      description TEXT NOT NULL,
      languages TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      sector TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      services TEXT NOT NULL,
      opening_hours TEXT NOT NULL,
      emergency_available INT NOT NULL,
      phone TEXT NOT NULL,
      rating DOUBLE PRECISION NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pharmacies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT NOT NULL,
      opening_hours TEXT NOT NULL,
      delivery_available INT NOT NULL,
      rating DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      generic_name TEXT NOT NULL,
      form TEXT NOT NULL,
      dose TEXT NOT NULL,
      price INT NOT NULL,
      pharmacy_id TEXT NOT NULL,
      pharmacy_name TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      stock INT NOT NULL,
      available INT NOT NULL,
      prescription_required INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS laboratories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      tests TEXT NOT NULL,
      opening_hours TEXT NOT NULL,
      phone TEXT NOT NULL,
      rating DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imaging_centers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      exams TEXT NOT NULL,
      opening_hours TEXT NOT NULL,
      phone TEXT NOT NULL,
      rating DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nurses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      qualification TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      services TEXT NOT NULL,
      availability TEXT NOT NULL,
      price INT NOT NULL,
      photo TEXT,
      rating DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ambulances (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT NOT NULL,
      vehicles TEXT NOT NULL,
      available INT NOT NULL,
      response_time TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      patient_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      provider_photo TEXT,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      price INT NOT NULL,
      payment_status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      patient_id TEXT NOT NULL,
      provider_id TEXT,
      service TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INT NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL,
      breakdown TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_orders (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      patient_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      dose TEXT NOT NULL,
      quantity INT NOT NULL,
      pharmacy_id TEXT NOT NULL,
      pharmacy_name TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_time_slot TEXT NOT NULL,
      delivery_fee INT NOT NULL,
      total INT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emergency_requests (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT NOT NULL,
      emergency_type TEXT NOT NULL,
      destination_hospital TEXT NOT NULL,
      status TEXT NOT NULL,
      ambulance TEXT,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL,
      read INT NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      link TEXT
    );

    CREATE TABLE IF NOT EXISTS availability (
      provider_id TEXT NOT NULL,
      day TEXT NOT NULL,
      slot TEXT NOT NULL,
      available INT NOT NULL DEFAULT 1,
      PRIMARY KEY (provider_id, day, slot)
    );

    CREATE TABLE IF NOT EXISTS provider_applications (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      org_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      license_number TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      review_note TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS provider_documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES provider_applications(id) ON DELETE CASCADE
    );
  `)
}