import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppProvider } from './stores/AppStore'
import { AuthProvider, useAuth } from './stores/AuthStore'
import { PatientLayout } from './layouts/PatientLayout'
import { ProviderLayout } from './layouts/ProviderLayout'

import { LoginPage, RegisterPage, ProviderRegisterPage, NotFoundPage } from './pages/auth'
import {
  HomePage,
  SearchPage,
  DoctorsPage,
  DoctorProfilePage,
  AppointmentsPage,
  NewAppointmentPage,
  PharmaciesPage,
  MedicinesPage,
  LaboratoriesPage,
  ImagingPage,
  HospitalsPage,
  NursesPage,
  PractitionersPage,
  MedicalNgosPage,
  AmbulancePage,
  DeliveryPage,
  PaymentsPage,
  ProfilePage,
  NotificationsPage,
  OrientationPage,
} from './pages/patient'
import {
  ProviderDashboardPage,
  ProviderAppointmentsPage,
  ProviderAvailabilityPage,
  ProviderRequestsPage,
  ProviderPaymentsPage,
  ProviderProfilePage,
} from './pages/provider'
import { AdminLayout } from './layouts/AdminLayout'
import {
  AdminApplicationsPage,
  AdminApplicationDetailPage,
  AdminPatientsPage,
  AdminPatientDetailPage,
  AdminProfilePage,
} from './pages/admin'

type GuardRole = 'patient' | 'provider' | 'admin'

function RequireAuth({ role, children }: { role: GuardRole; children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const isProvider = user.role !== 'patient' && user.role !== 'admin'
  const isAdmin = user.role === 'admin'

  if (role === 'admin') {
    if (!isAdmin) return <Navigate to={isProvider ? '/provider' : '/patient'} replace />
    return <>{children}</>
  }
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }
  if (role === 'patient' && isProvider) {
    return <Navigate to="/provider" replace />
  }
  if (role === 'provider' && !isProvider) {
    return <Navigate to="/patient" replace />
  }
  return <>{children}</>
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to={user.role === 'patient' ? '/patient' : '/provider'} replace />
}

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/provider" element={<ProviderRegisterPage />} />

          <Route
            path="/patient"
            element={
              <RequireAuth role="patient">
                <PatientLayout />
              </RequireAuth>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="doctors/:id" element={<DoctorProfilePage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="appointments/new" element={<NewAppointmentPage />} />
            <Route path="appointments/new/:doctorId" element={<NewAppointmentPage />} />
            <Route path="pharmacies" element={<PharmaciesPage />} />
            <Route path="medicines" element={<MedicinesPage />} />
            <Route path="laboratories" element={<LaboratoriesPage />} />
            <Route path="imaging" element={<ImagingPage />} />
            <Route path="hospitals" element={<HospitalsPage />} />
            <Route path="nurses" element={<NursesPage />} />
            <Route path="professionals" element={<PractitionersPage />} />
            <Route path="ngos" element={<MedicalNgosPage />} />
            <Route path="ambulance" element={<AmbulancePage />} />
            <Route path="delivery" element={<DeliveryPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="orientation" element={<OrientationPage />} />
          </Route>

          <Route
            path="/provider"
            element={
              <RequireAuth role="provider">
                <ProviderLayout />
              </RequireAuth>
            }
          >
            <Route index element={<ProviderDashboardPage />} />
            <Route path="appointments" element={<ProviderAppointmentsPage />} />
            <Route path="availability" element={<ProviderAvailabilityPage />} />
            <Route path="requests" element={<ProviderRequestsPage />} />
            <Route path="payments" element={<ProviderPaymentsPage />} />
            <Route path="profile" element={<ProviderProfilePage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminApplicationsPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
            <Route path="applications/:id" element={<AdminApplicationDetailPage />} />
            <Route path="patients" element={<AdminPatientsPage />} />
            {/* Was bound to AdminApplicationDetailPage, so following a patient
                loaded an application by the wrong id. */}
            <Route path="patients/:id" element={<AdminPatientDetailPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  )
}