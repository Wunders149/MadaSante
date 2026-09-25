import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  Appointment,
  DeliveryOrder,
  EmergencyRequest,
  Lang,
  NotificationItem,
  Payment,
  PaymentMethod,
} from '../types'
import { apiRoutes } from '../lib/api'
import { useAuth } from './AuthStore'
import { translate } from '../i18n'

export interface Toast {
  id: string
  title: string
  message?: string
  tone: 'success' | 'error' | 'info'
}

interface BookAppointmentInput {
  providerId: string
  providerType: Appointment['providerType']
  providerName: string
  providerPhoto?: string
  type: string
  date: string
  time: string
  location: string
  price: number
}

interface PayInput {
  service: string
  providerName: string
  providerId?: string
  amount: number
  method: PaymentMethod
  breakdown: { label: string; amount: number }[]
}

interface DeliveryInput {
  medicineId: string
  medicineName: string
  dose: string
  quantity: number
  pharmacyId: string
  pharmacyName: string
  deliveryAddress: string
  deliveryTimeSlot: string
  deliveryFee: number
  total: number
}

interface EmergencyInput {
  patientName: string
  phone: string
  location: string
  emergencyType: string
  destinationHospital: string
}

interface AppContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string

  toasts: Toast[]
  toast: (title: string, message?: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void

  notifications: NotificationItem[]
  unreadCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  pushNotification: (n: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => void

  appointments: Appointment[]
  payments: Payment[]
  deliveries: DeliveryOrder[]
  emergencyRequests: EmergencyRequest[]

  bookAppointment: (input: BookAppointmentInput) => Promise<Appointment>
  pay: (input: PayInput) => Promise<Payment>
  placeDeliveryOrder: (input: DeliveryInput) => Promise<DeliveryOrder>
  requestAmbulance: (input: EmergencyInput) => Promise<EmergencyRequest>
  requestNurse: (input: BookAppointmentInput) => Promise<Appointment>
}

const AppContext = createContext<AppContextValue | null>(null)

const EMPTY = {
  appointments: [] as Appointment[],
  payments: [] as Payment[],
  deliveries: [] as DeliveryOrder[],
  emergencyRequests: [] as EmergencyRequest[],
  notifications: [] as NotificationItem[],
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('ms_lang')
    return saved === 'mg' || saved === 'en' ? saved : 'fr'
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [data, setData] = useState(EMPTY)
  const timers = useRef<number[]>([])

  useEffect(() => {
    localStorage.setItem('ms_lang', lang)
  }, [lang])

  useEffect(() => {
    return () => timers.current.forEach((id) => window.clearTimeout(id))
  }, [])

  useEffect(() => {
    if (!user) {
      setData(EMPTY)
      return
    }
    let cancelled = false
    Promise.all([
      apiRoutes.appointments(),
      apiRoutes.payments(),
      apiRoutes.deliveries(),
      apiRoutes.emergencyRequests(),
      apiRoutes.notifications(),
    ])
      .then(([appointments, payments, deliveries, emergencyRequests, notifications]) => {
        if (cancelled) return
        setData({ appointments, payments, deliveries, emergencyRequests, notifications })
      })
      .catch(() => {
        if (cancelled) return
        setData(EMPTY)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (title: string, message?: string, tone: Toast['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev, { id, title, message, tone }])
      timers.current.push(window.setTimeout(() => dismissToast(id), 4200))
    },
    [dismissToast],
  )

  const pushNotification = useCallback(
    async (n: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => {
      const created = await apiRoutes.createNotification(n)
      setData((prev) => ({ ...prev, notifications: [created, ...prev.notifications] }))
    },
    [],
  )

  const markNotificationRead = useCallback((id: string) => {
    apiRoutes.markNotificationRead(id).catch(() => undefined)
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    apiRoutes.markAllNotificationsRead().catch(() => undefined)
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [])

  const unreadCount = useMemo(
    () => data.notifications.filter((n) => !n.read).length,
    [data.notifications],
  )

  const bookAppointment = useCallback(async (input: BookAppointmentInput): Promise<Appointment> => {
    const appointment = await apiRoutes.createAppointment(input)
    setData((prev) => ({ ...prev, appointments: [appointment, ...prev.appointments] }))
    return appointment
  }, [])

  const pay = useCallback(async (input: PayInput): Promise<Payment> => {
    const payment = await apiRoutes.createPayment(input)
    setData((prev) => ({ ...prev, payments: [payment, ...prev.payments] }))
    return payment
  }, [])

  const placeDeliveryOrder = useCallback(async (input: DeliveryInput): Promise<DeliveryOrder> => {
    const order = await apiRoutes.createDelivery(input)
    setData((prev) => ({ ...prev, deliveries: [order, ...prev.deliveries] }))
    return order
  }, [])

  const requestAmbulance = useCallback(async (input: EmergencyInput): Promise<EmergencyRequest> => {
    const request = await apiRoutes.createEmergencyRequest(input)
    setData((prev) => ({ ...prev, emergencyRequests: [request, ...prev.emergencyRequests] }))
    return request
  }, [])

  const requestNurse = useCallback(async (input: BookAppointmentInput): Promise<Appointment> => {
    const appointment = await apiRoutes.createAppointment({ ...input, status: 'pending', paymentStatus: 'pending' })
    setData((prev) => ({ ...prev, appointments: [appointment, ...prev.appointments] }))
    return appointment
  }, [])

  const setLang = useCallback((l: Lang) => setLangState(l), [])

  const value: AppContextValue = {
    lang,
    setLang,
    t,
    toasts,
    toast,
    dismissToast,
    notifications: data.notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    pushNotification,
    appointments: data.appointments,
    payments: data.payments,
    deliveries: data.deliveries,
    emergencyRequests: data.emergencyRequests,
    bookAppointment,
    pay,
    placeDeliveryOrder,
    requestAmbulance,
    requestNurse,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}