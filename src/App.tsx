import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppProvider } from './stores/AppStore'
import { AuthProvider, useAuth } from './stores/AuthStore'
import { PatientLayout } from './layouts/PatientLayout'
import { ProviderLayout } from './layouts/ProviderLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { RouteFallback } from './components/ui/RouteFallback'
import { LoginPage, RegisterPage, ProviderRegisterPage, NotFoundPage } from './pages/auth'

/**
 * Every page below the layouts is loaded on demand.
 *
 * Eagerly importing 30+ pages shipped one ~620 kB chunk that every visitor
 * downloaded in full, including the admin and provider consoles they will
 * never see. The layouts stay eager because they are needed immediately after
 * authentication; everything else is code-split per route.
 */
const HomePage = lazy(() => import('./pages/patient/HomePage').then((m) => ({ default: m.HomePage })))
const SearchPage = lazy(() => import('./pages/patient/SearchPage').then((m) => ({ default: m.SearchPage })))
const DoctorsPage = lazy(() => import('./pages/patient/DoctorsPage').then((m) => ({ default: m.DoctorsPage })))
const DoctorProfilePage = lazy(() => import('./pages/patient/DoctorProfilePage').then((m) => ({ default: m.DoctorProfilePage })))
const AppointmentsPage = lazy(() => import('./pages/patient/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })))
const NewAppointmentPage = lazy(() => import('./pages/patient/NewAppointmentPage').then((m) => ({ default: m.NewAppointmentPage })))
const PharmaciesPage = lazy(() => import('./pages/patient/PharmaciesPage').then((m) => ({ default: m.PharmaciesPage })))
const MedicinesPage = lazy(() => import('./pages/patient/MedicinesPage').then((m) => ({ default: m.MedicinesPage })))
const LaboratoriesPage = lazy(() => import('./pages/patient/LaboratoriesPage').then((m) => ({ default: m.LaboratoriesPage })))
const ImagingPage = lazy(() => import('./pages/patient/ImagingPage').then((m) => ({ default: m.ImagingPage })))
const HospitalsPage = lazy(() => import('./pages/patient/HospitalsPage').then((m) => ({ default: m.HospitalsPage })))
const NursesPage = lazy(() => import('./pages/patient/NursesPage').then((m) => ({ default: m.NursesPage })))
const PractitionersPage = lazy(() => import('./pages/patient/PractitionersPage').then((m) => ({ default: m.PractitionersPage })))
const PractitionerProfilePage = lazy(() => import('./pages/patient/PractitionerProfilePage').then((m) => ({ default: m.PractitionerProfilePage })))
const MedicalNgosPage = lazy(() => import('./pages/patient/MedicalNgosPage').then((m) => ({ default: m.MedicalNgosPage })))
const AmbulancePage = lazy(() => import('./pages/patient/AmbulancePage').then((m) => ({ default: m.AmbulancePage })))
const DeliveryPage = lazy(() => import('./pages/patient/DeliveryPage').then((m) => ({ default: m.DeliveryPage })))
const PaymentsPage = lazy(() => import('./pages/patient/PaymentsPage').then((m) => ({ default: m.PaymentsPage })))
const ProfilePage = lazy(() => import('./pages/patient/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const NotificationsPage = lazy(() => import('./pages/patient/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const OrientationPage = lazy(() => import('./pages/patient/OrientationPage').then((m) => ({ default: m.OrientationPage })))

const ProviderDashboardPage = lazy(() => import('./pages/provider/ProviderDashboardPage').then((m) => ({ default: m.ProviderDashboardPage })))
const ProviderAppointmentsPage = lazy(() => import('./pages/provider/ProviderAppointmentsPage').then((m) => ({ default: m.ProviderAppointmentsPage })))
const ProviderAvailabilityPage = lazy(() => import('./pages/provider/ProviderAvailabilityPage').then((m) => ({ default: m.ProviderAvailabilityPage })))
const ProviderRequestsPage = lazy(() => import('./pages/provider/ProviderRequestsPage').then((m) => ({ default: m.ProviderRequestsPage })))
const ProviderPaymentsPage = lazy(() => import('./pages/provider/ProviderPaymentsPage').then((m) => ({ default: m.ProviderPaymentsPage })))
const ProviderProfilePage = lazy(() => import('./pages/provider/ProviderProfilePage').then((m) => ({ default: m.ProviderProfilePage })))

const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage').then((m) => ({ default: m.AdminApplicationsPage })))
const AdminApplicationDetailPage = lazy(() => import('./pages/admin/AdminApplicationDetailPage').then((m) => ({ default: m.AdminApplicationDetailPage })))
const AdminPatientsPage = lazy(() => import('./pages/admin/AdminPatientsPage').then((m) => ({ default: m.AdminPatientsPage })))
const AdminPatientDetailPage = lazy(() => import('./pages/admin/AdminPatientDetailPage').then((m) => ({ default: m.AdminPatientDetailPage })))
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage').then((m) => ({ default: m.AdminProfilePage })))

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
        <LazyRoutes />
      </AppProvider>
    </AuthProvider>
  )
}


/**
 * Every page below a layout is lazy, so a chunk fetch needs a Suspense
 * boundary. It sits inside the providers because the layouts render their own
 * chrome (sidebar, header) and should stay on screen while the page loads.
 */
function LazyRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/provider" element={<ProviderRegisterPage />} />

          <Route
            path="/patient"
            element={
              <RequireAuth role="patient">
                <ErrorBoundary label="espace patient">
                  <PatientLayout />
                </ErrorBoundary>
              </RequireAuth>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="doctors" element={<DoctorsPage />} />
            <Route path="doctors/:id" element={<DoctorProfilePage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="appointments/new" element={<NewAppointmentPage />} />
            {/* Legacy doctor-only shape, kept because DoctorCard and
                DoctorProfilePage link here. */}
            <Route path="appointments/new/:doctorId" element={<NewAppointmentPage />} />
            {/* Generic shape so any bookable role can enter the same wizard. */}
            <Route path="appointments/new/:providerType/:providerId" element={<NewAppointmentPage />} />
            <Route path="pharmacies" element={<PharmaciesPage />} />
            <Route path="medicines" element={<MedicinesPage />} />
            <Route path="laboratories" element={<LaboratoriesPage />} />
            <Route path="imaging" element={<ImagingPage />} />
            <Route path="hospitals" element={<HospitalsPage />} />
            <Route path="nurses" element={<NursesPage />} />
            <Route path="professionals" element={<PractitionersPage />} />
            <Route path="professionals/:id" element={<PractitionerProfilePage />} />
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
                <ErrorBoundary label="espace professionnel">
                  <ProviderLayout />
                </ErrorBoundary>
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
                <ErrorBoundary label="espace admin">
                  <AdminLayout />
                </ErrorBoundary>
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
      </Suspense>
    </ErrorBoundary>
  )
}
