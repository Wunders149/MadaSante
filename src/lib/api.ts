import type {
  Ambulance,
  Appointment,
  AppointmentStatus,
  ConsultationType,
  DeliveryOrder,
  Doctor,
  EmergencyRequest,
  Hospital,
  ImagingCenter,
  Laboratory,
  MedicalNgo,
  Medicine,
  NotificationItem,
  Nurse,
  Payment,
  PaymentMethod,
  Pharmacy,
  Provider,
  ProviderApplication,
  ProviderProfile,
  Practitioner,
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
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api<{ ok: boolean }>('/auth/me/password', { method: 'PUT', body: JSON.stringify(body) }),
  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  providerRegister: (body: Record<string, unknown>) =>
    api<{ applicationId: string; reference: string; status: 'pending' }>('/auth/provider-register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  adminApplications: (status?: string) =>
    api<ProviderApplication[]>(`/admin/applications${status ? qs({ status }) : ''}`),
  adminApplication: (id: string) =>
    api<{ application: ProviderApplication }>(`/admin/applications/${id}`),
  adminReviewApplication: (id: string, body: { status: 'approved' | 'rejected'; note?: string }) =>
    api<{ application: ProviderApplication }>(`/admin/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  doctors: (query?: string) => api<Doctor[]>(`/doctors${query ?? ''}`),
  doctor: (id: string) => api<Doctor>(`/doctors/${id}`),
  hospitals: (query?: string) => api<Hospital[]>(`/hospitals${query ?? ''}`),
  pharmacies: (query?: string) => api<Pharmacy[]>(`/pharmacies${query ?? ''}`),
  medicines: (query?: string) => api<Medicine[]>(`/medicines${query ?? ''}`),
  laboratories: (query?: string) => api<Laboratory[]>(`/laboratories${query ?? ''}`),
  imagingCenters: (query?: string) => api<ImagingCenter[]>(`/imaging-centers${query ?? ''}`),
  nurses: (query?: string) => api<Nurse[]>(`/nurses${query ?? ''}`),
  ambulances: (query?: string) => api<Ambulance[]>(`/ambulances${query ?? ''}`),
  practitioners: (query?: string) => api<Practitioner[]>(`/practitioners${query ?? ''}`),
  practitioner: (id: string) => api<Practitioner>(`/practitioners/${id}`),
  medicalNgos: (query?: string) => api<MedicalNgo[]>(`/medical-ngos${query ?? ''}`),
  summary: () => api<Record<string, number>>('/summary'),
  cities: () => api<string[]>('/cities'),
  search: (q: string, category: string) =>
    api<SearchResults>(`/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),

  appointments: (query?: string) => api<Appointment[]>(`/appointments${query ?? ''}`),
  createAppointment: (body: unknown) =>
    api<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateAppointmentStatus: (id: string, status: AppointmentStatus) =>
    api<Appointment>(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  payments: (query?: string) => api<Payment[]>(`/payments${query ?? ''}`),
  /**
   * Settles an appointment. The amount, service and provider come from the
   * appointment, so only the appointment and the method are sent.
   */
  createPayment: (body: { appointmentId: string; method: PaymentMethod }) =>
    api<Payment>('/payments', { method: 'POST', body: JSON.stringify(body) }),
  paymentsSummary: () => api<{ total: number; count: number }>('/payments/summary'),

  notifications: () => api<NotificationItem[]>('/notifications'),
  createNotification: (body: unknown) =>
    api<NotificationItem>('/notifications', { method: 'POST', body: JSON.stringify(body) }),
  markNotificationRead: (id: string) =>
    api<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => api<{ ok: boolean }>('/notifications/read-all', { method: 'PATCH' }),

  providerMe: () => api<{ user: User; provider?: ProviderProfile }>('/providers/me'),
  updateProviderMe: (body: unknown) =>
    api<{ user: User; provider?: ProviderProfile }>('/providers/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  /**
   * Catalog fields the provider owns. Prices set here are the basis for every
   * booking total the server computes.
   */
  updateProviderCatalog: (body: {
    name?: string
    city?: string
    location?: string
    price?: number
    priceHome?: number | null
    specialty?: string
    description?: string
    consultationTypes?: ConsultationType[]
    phone?: string
  }) =>
    api<{ user: User; provider?: ProviderProfile }>('/providers/me/catalog', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  availability: () => api<{ day: string; slot: string; available: boolean }[]>('/providers/me/availability'),
  saveAvailability: (entries: { day: string; slot: string; available: boolean }[]) =>
    api<{ ok: boolean }>('/providers/me/availability', { method: 'PUT', body: JSON.stringify({ entries }) }),
  providers: (params?: {
    role?: string
    city?: string
    location?: string
    page?: number
    limit?: number
  }) =>
    api<{ providers: Provider[]; page: number; limit: number; total: number; totalPages: number }>(`/providers${qs(params ?? {})}`),
  adminUsers: (params?: {
    role?: string
    page?: number
    limit?: number
  }) =>
    api<{ users: User[]; page: number; limit: number; total: number; totalPages: number }>(`/admin/users${qs(params ?? {})}`),
  adminUser: (id: string) => api<AdminUserDetail>(`/admin/users/${id}`),

  deliveries: () => api<DeliveryOrder[]>('/deliveries'),
  /**
   * Orders a medicine. Name, dose, pharmacy, unit price, delivery fee and
   * total are all resolved server-side from the medicine record, so only the
   * address, slot and quantity travel.
   */
  createDelivery: (body: {
    medicineId: string
    quantity: number
    deliveryAddress: string
    deliveryTimeSlot: string
    prescriptionConfirmed?: boolean
  }) => api<DeliveryOrder>('/deliveries', { method: 'POST', body: JSON.stringify(body) }),

  emergencyRequests: () => api<EmergencyRequest[]>('/emergency-requests'),
  createEmergencyRequest: (body: unknown) =>
    api<EmergencyRequest>('/emergency-requests', { method: 'POST', body: JSON.stringify(body) }),
}

/** Admin view of one account plus its recent activity. */
export interface AdminUserDetail {
  user: User
  totals: {
    appointments: number
    payments: number
    paidTotal: number
    deliveries: number
    emergency: number
  }
  appointments: Array<{
    id: string
    reference: string
    provider_name: string
    type: string
    date: string
    time: string
    status: string
    price: number
    payment_status: string
  }>
  payments: Array<{
    id: string
    reference: string
    provider_name: string
    service: string
    date: string
    amount: number
    method: string
    status: string
  }>
  deliveries: Array<{
    id: string
    reference: string
    medicine_name: string
    quantity: number
    total: number
    status: string
    date: string
  }>
  emergencyRequests: Array<{
    id: string
    reference: string
    emergency_type: string
    destination_hospital: string
    status: string
    date: string
  }>
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
  practitioners: Practitioner[]
  ngos: MedicalNgo[]
  total: number
}