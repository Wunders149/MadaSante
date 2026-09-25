import bcrypt from 'bcryptjs'
import { db } from './db.js'

export function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.warn('[boot] No ADMIN_EMAIL / ADMIN_PASSWORD set — super admin was not created.')
    return
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return
  db.prepare(`
    INSERT INTO users (id, first_name, last_name, phone, email, password_hash, role, location, photo, provider_id)
    VALUES (?, ?, ?, ?, ?, ?, 'admin', ?, NULL, NULL)
  `).run('u_admin', 'Super', 'Admin', '+261 00 000 00 00', email, bcrypt.hashSync(password, 10), 'Antananarivo')
  console.log(`[boot] Super admin created (${email}).`)
}