export type Role =
  | 'patient'
  | 'doctor'
  | 'nurse'
  | 'pharmacy'
  | 'laboratory'
  | 'imaging_center'
  | 'hospital'
  | 'ambulance_driver'
  | 'admin'

export type Lang = 'fr' | 'mg' | 'en'

export interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  photo?: string
  role: Role
  location?: string
  providerId?: string | null
  createdAt?: string
  appointmentCount?: number
  paymentCount?: number
  deliveryCount?: number
}

export interface Provider {
  id: string
  role: Role
  name: string
  location?: string
  city?: string
  photo?: string
  rating: number
  description?: string
}

export type ConsultationType = 'cabinet' | 'home' | 'hospital'

export interface Doctor {
  id: string
  name: string
  specialty: string
  type: 'generalist' | 'specialist'
  location: string
  city: string
  consultationTypes: ConsultationType[]
  price: number
  priceHome?: number
  availability: string[]
  availabilitySlots: string[]
  photo: string
  rating: number
  reviews: number
  description: string
  languages: string[]
}

export type FacilityType = 'hospital' | 'clinic'
export type FacilitySector = 'public' | 'private'

export interface Hospital {
  id: string
  name: string
  type: FacilityType
  sector: FacilitySector
  location: string
  city: string
  services: string[]
  openingHours: string
  emergencyAvailable: boolean
  phone: string
  rating: number
  description: string
}

export interface Pharmacy {
  id: string
  name: string
  location: string
  city: string
  phone: string
  openingHours: string
  deliveryAvailable: boolean
  rating: number
}

export interface Medicine {
  id: string
  name: string
  genericName: string
  form: string
  dose: string
  price: number
  pharmacyId: string
  pharmacyName: string
  location: string
  city: string
  stock: number
  available: boolean
  prescriptionRequired: boolean
}

export interface Laboratory {
  id: string
  name: string
  location: string
  city: string
  tests: string[]
  openingHours: string
  phone: string
  rating: number
}

export interface ImagingExam {
  type: string
  price: number
}

export interface ImagingCenter {
  id: string
  name: string
  location: string
  city: string
  exams: ImagingExam[]
  openingHours: string
  phone: string
  rating: number
}

export interface Nurse {
  id: string
  name: string
  qualification: string
  location: string
  city: string
  services: string[]
  availability: string[]
  price: number
  photo: string
  rating: number
}

export interface Ambulance {
  id: string
  provider: string
  location: string
  city: string
  phone: string
  vehicles: string[]
  available: boolean
  responseTime: string
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  reference: string
  patientId: string
  providerId: string
  providerType: 'doctor' | 'laboratory' | 'imaging' | 'hospital' | 'clinic' | 'nurse'
  providerName: string
  providerPhoto?: string
  type: string
  date: string
  time: string
  location: string
  status: AppointmentStatus
  price: number
  paymentStatus: 'paid' | 'pending' | 'unpaid'
}

export type PaymentMethod = 'orange_money' | 'mvola'
export type PaymentStatus = 'success' | 'pending' | 'failed'

export interface Payment {
  id: string
  reference: string
  patientId: string
  providerId?: string
  service: string
  providerName: string
  date: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  breakdown: { label: string; amount: number }[]
}

export type DeliveryStatus = 'received' | 'preparing' | 'in_delivery' | 'delivered'

export interface DeliveryOrder {
  id: string
  reference: string
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
  status: DeliveryStatus
  date: string
}

export type EmergencyStatus = 'received' | 'searching' | 'assigned' | 'en_route' | 'arrived'

export interface EmergencyRequest {
  id: string
  reference: string
  patientName: string
  phone: string
  location: string
  emergencyType: string
  destinationHospital: string
  status: EmergencyStatus
  ambulance?: string
  date: string
}

export type NotificationCategory = 'appointment' | 'payment' | 'delivery' | 'emergency' | 'system'

export interface NotificationItem {
  id: string
  title: string
  message: string
  category: NotificationCategory
  read: boolean
  createdAt: string
  link?: string
}

export type ProviderApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface ProviderDocument {
  id: string
  docType: string
  fileName: string
  mime: string
  data: string
}

export interface ProviderApplication {
  id: string
  reference: string
  role: Role
  orgName: string
  firstName: string
  lastName: string
  phone: string
  email: string
  location: string
  city: string
  licenseNumber: string
  status: ProviderApplicationStatus
  reviewNote?: string
  reviewedAt?: string
  createdAt: string
  documentCount?: number
  documents?: ProviderDocument[]
}