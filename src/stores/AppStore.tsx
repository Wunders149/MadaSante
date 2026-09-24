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
  Theme,
} from '../types'
import { initialAppointments, initialDeliveries, initialEmergency, initialNotifications, initialPayments } from '../data/mock'
import { generateReference } from '../lib/format'
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
  theme: Theme
  setTheme: (t: Theme) => void
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

const wait = (ms = 900) => new Promise<void>((r) => setTimeout(r, ms))

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('ms_lang')
    return saved === 'mg' || saved === 'en' ? saved : 'fr'
  })
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('ms_theme')
    return saved === 'v2' ? 'v2' : 'v1'
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(initialDeliveries)
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>(initialEmergency)
  const timers = useRef<number[]>([])

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'v2' ? 'v2' : ''
    localStorage.setItem('ms_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('ms_lang', lang)
  }, [lang])

  useEffect(() => {
    return () => timers.current.forEach((id) => window.clearTimeout(id))
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (title: string, message?: string, tone: Toast['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev, { id, title, message, tone }])
      timers.current.push(window.setTimeout(() => dismissToast(id), 4200))
    },
    [dismissToast],
  )

  const pushNotification = useCallback((n: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => {
    setNotifications((prev) => [
      {
        ...n,
        id: `notif-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const bookAppointment = useCallback(
    async (input: BookAppointmentInput): Promise<Appointment> => {
      await wait()
      const appointment: Appointment = {
        id: `ap-${Date.now()}`,
        reference: generateReference('MS'),
        patientId: 'u_patient_1',
        providerId: input.providerId,
        providerType: input.providerType,
        providerName: input.providerName,
        providerPhoto: input.providerPhoto,
        type: input.type,
        date: input.date,
        time: input.time,
        location: input.location,
        status: 'confirmed',
        price: input.price,
        paymentStatus: 'unpaid',
      }
      setAppointments((prev) => [appointment, ...prev])
      return appointment
    },
    [],
  )

  const pay = useCallback(
    async (input: PayInput): Promise<Payment> => {
      await wait(1200)
      const payment: Payment = {
        id: `pay-${Date.now()}`,
        reference: generateReference('PAY'),
        service: input.service,
        providerName: input.providerName,
        date: new Date().toISOString().slice(0, 10),
        amount: input.amount,
        method: input.method,
        status: 'success',
        breakdown: input.breakdown,
      }
      setPayments((prev) => [payment, ...prev])
      return payment
    },
    [],
  )

  const placeDeliveryOrder = useCallback(async (input: DeliveryInput): Promise<DeliveryOrder> => {
    await wait()
    const order: DeliveryOrder = {
      id: `del-${Date.now()}`,
      reference: generateReference('DEL'),
      medicineId: input.medicineId,
      medicineName: input.medicineName,
      dose: input.dose,
      quantity: input.quantity,
      pharmacyId: input.pharmacyId,
      pharmacyName: input.pharmacyName,
      deliveryAddress: input.deliveryAddress,
      deliveryTimeSlot: input.deliveryTimeSlot,
      deliveryFee: input.deliveryFee,
      total: input.total,
      status: 'received',
      date: new Date().toISOString().slice(0, 10),
    }
    setDeliveries((prev) => [order, ...prev])
    return order
  }, [])

  const requestAmbulance = useCallback(async (input: EmergencyInput): Promise<EmergencyRequest> => {
    await wait(600)
    const request: EmergencyRequest = {
      id: `erg-${Date.now()}`,
      reference: generateReference('AMBU'),
      patientName: input.patientName,
      phone: input.phone,
      location: input.location,
      emergencyType: input.emergencyType,
      destinationHospital: input.destinationHospital,
      status: 'searching',
      date: new Date().toISOString().slice(0, 10),
    }
    setEmergencyRequests((prev) => [request, ...prev])
    return request
  }, [])

  const requestNurse = useCallback(
    async (input: BookAppointmentInput): Promise<Appointment> => {
      await wait()
      const request: Appointment = {
        id: `n-${Date.now()}`,
        reference: generateReference('MS'),
        patientId: 'u_patient_1',
        providerId: input.providerId,
        providerType: input.providerType,
        providerName: input.providerName,
        providerPhoto: input.providerPhoto,
        type: input.type,
        date: input.date,
        time: input.time,
        location: input.location,
        status: 'pending',
        price: input.price,
        paymentStatus: 'pending',
      }
      setAppointments((prev) => [request, ...prev])
      return request
    },
    [],
  )

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const setTheme = useCallback((x: Theme) => setThemeState(x), [])

  const value: AppContextValue = {
    lang,
    setLang,
    theme,
    setTheme,
    t,
    toasts,
    toast,
    dismissToast,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    pushNotification,
    appointments,
    payments,
    deliveries,
    emergencyRequests,
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