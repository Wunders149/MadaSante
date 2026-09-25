export function generateReference(prefix: string): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${random}`
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

export function isProviderRole(role: string): boolean {
  return role !== 'patient'
}