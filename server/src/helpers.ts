export function generateReference(prefix: string): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${random}`
}

/**
 * Collision-resistant primary key. `Date.now()` alone collides when two
 * requests land in the same millisecond, so the random suffix widens the
 * space well past the point where a clash is realistic.
 */
export function uniqueId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export type UserRow = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  password_hash: string
  role: string
  location: string | null
  photo: string | null
  provider_id: string | null
}

export function publicUser(row: UserRow) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    location: row.location ?? undefined,
    photo: row.photo ?? undefined,
    providerId: row.provider_id,
  }
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export const PROVIDER_ROLES = [
  'doctor',
  'nurse',
  'pharmacy',
  'laboratory',
  'imaging_center',
  'hospital',
  'ambulance_driver',
] as const

export function isProviderRole(role: string): boolean {
  return (PROVIDER_ROLES as readonly string[]).includes(role)
}