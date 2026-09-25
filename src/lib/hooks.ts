import { useQuery } from '@tanstack/react-query'
import { apiRoutes, qs } from './api'
import type {
  Ambulance,
  Doctor,
  Hospital,
  ImagingCenter,
  Laboratory,
  Medicine,
  Nurse,
  Pharmacy,
  User,
} from '../types'

export function useDoctors(params?: { city?: string; type?: string }) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => apiRoutes.doctors(qs(params)),
  })
}

export function useDoctor(id?: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => apiRoutes.doctor(id as string),
    enabled: Boolean(id),
  })
}

export function useHospitals(params?: { city?: string; type?: string; sector?: string }) {
  return useQuery({
    queryKey: ['hospitals', params],
    queryFn: () => apiRoutes.hospitals(qs(params)),
  })
}

export function usePharmacies() {
  return useQuery({ queryKey: ['pharmacies'], queryFn: () => apiRoutes.pharmacies() })
}

export function useMedicines() {
  return useQuery({ queryKey: ['medicines'], queryFn: () => apiRoutes.medicines() })
}

export function useLaboratories() {
  return useQuery({ queryKey: ['laboratories'], queryFn: () => apiRoutes.laboratories() })
}

export function useImagingCenters() {
  return useQuery({ queryKey: ['imaging'], queryFn: () => apiRoutes.imagingCenters() })
}

export function useNurses() {
  return useQuery({ queryKey: ['nurses'], queryFn: () => apiRoutes.nurses() })
}

export function useAmbulances() {
  return useQuery({ queryKey: ['ambulances'], queryFn: () => apiRoutes.ambulances() })
}

export function useCatalogSummary() {
  return useQuery({ queryKey: ['summary'], queryFn: () => apiRoutes.summary() })
}

export function useCities() {
  return useQuery({ queryKey: ['cities'], queryFn: () => apiRoutes.cities() })
}

export function useSearch(q: string, category: string) {
  const query = q.trim()
  return useQuery({
    queryKey: ['search', query, category],
    queryFn: () => apiRoutes.search(query, category),
    enabled: Boolean(query),
  })
}

export function useProviderMe() {
  return useQuery({
    queryKey: ['providers', 'me'],
    queryFn: () => apiRoutes.providerMe(),
  })
}

export function useAvailability() {
  return useQuery({
    queryKey: ['availability'],
    queryFn: () => apiRoutes.availability(),
  })
}

export type { Ambulance, Doctor, Hospital, ImagingCenter, Laboratory, Medicine, Nurse, Pharmacy, User }