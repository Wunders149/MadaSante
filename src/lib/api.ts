import type {
  Ambulance,
  Appointment,
  DeliveryOrder,
  Doctor,
  EmergencyRequest,
  Hospital,
  ImagingCenter,
  Laboratory,
  Medicine,
  NotificationItem,
  Nurse,
  Payment,
  Pharmacy,
  User,
} from '../types'

const API_BASE = '/api'

export interface ApiErrorBody {
  error?: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('ms_session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (init?.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (!res.ok) {
    let message = `Requête échouée (${res.status})`
    try {
      const body = (await res.json()) as ApiErrorBody
      if (body?.error) message = body.error
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`
}

export const apiRoutes = {
  login: (body: { email: string; password: string; role?: string }) =>
    api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: Record<string, unknown>) =>
    api<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api<{ user: User }>('/auth/me'),
  updateMe: (body: Record<string, unknown>) =>
    api<{ user: User }>('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  doctors: (query?: string) => api<Doctor[]>(`/doctors${query ?? ''}`),
  doctor: (id: string) => api<Doctor>(`/doctors/${id}`),
  hospitals: (query?: string) => api<Hospital[]>(`/hospitals${query ?? ''}`),
  pharmacies: (query?: string) => api<Pharmacy[]>(`/pharmacies${query ?? ''}`),
  medicines: (query?: string) => api<Medicine[]>(`/medicines${query ?? ''}`),
  laboratories: (query?: string) => api<Laboratory[]>(`/laboratories${query ?? ''}`),
  imagingCenters: (query?: string) => api<ImagingCenter[]>(`/imaging-centers${query ?? ''}`),
  nurses: (query?: string) => api<Nurse[]>(`/nurses${query ?? ''}`),
  ambulances: (query?: string) => api<Ambulance[]>(`/ambulances${query ?? ''}`),
  summary: () => api<Record<string, number>>('/summary'),
  cities: () => api<string[]>('/cities'),
  search: (q: string, category: string) =>
    api<SearchResults>(`/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),

  appointments: (query?: string) => api<Appointment[]>(`/appointments${query ?? ''}`),
  createAppointment: (body: unknown) =>
    api<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateAppointmentStatus: (id: string, status: string) =>
    api<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  payments: (query?: string) => api<Payment[]>(`/payments${query ?? ''}`),
  createPayment: (body: unknown) =>
    api<Payment>('/payments', { method: 'POST', body: JSON.stringify(body) }),
  paymentsSummary: () => api<{ total: number; count: number }>('/payments/summary'),

  notifications: () => api<NotificationItem[]>('/notifications'),
  createNotification: (body: unknown) =>
    api<NotificationItem>('/notifications', { method: 'POST', body: JSON.stringify(body) }),
  markNotificationRead: (id: string) =>
    api<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => api<{ ok: boolean }>('/notifications/read-all', { method: 'PATCH' }),

  providerMe: () => api<{ user: User; provider?: { id: string; name: string; location: string; city: string } }>('/providers/me'),
  updateProviderMe: (body: unknown) =>
    api<{ user: User; provider?: { id: string; name: string; location: string; city: string } }>('/providers/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  availability: () => api<{ day: string; slot: string; available: boolean }[]>('/providers/me/availability'),
  saveAvailability: (entries: { day: string; slot: string; available: boolean }[]) =>
    api<{ ok: boolean }>('/providers/me/availability', { method: 'PUT', body: JSON.stringify({ entries }) }),

  deliveries: () => api<DeliveryOrder[]>('/deliveries'),
  createDelivery: (body: unknown) =>
    api<DeliveryOrder>('/deliveries', { method: 'POST', body: JSON.stringify(body) }),

  emergencyRequests: () => api<EmergencyRequest[]>('/emergency-requests'),
  createEmergencyRequest: (body: unknown) =>
    api<EmergencyRequest>('/emergency-requests', { method: 'POST', body: JSON.stringify(body) }),
}

export interface SearchResults {
  query: string
  category: string
  doctors: Doctor[]
  medicines: Medicine[]
  facilities: Hospital[]
  laboratories: Laboratory[]
  imaging: ImagingCenter[]
  nurses: Nurse[]
  total: number
}