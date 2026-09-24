import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Ambulance as AmbulanceIcon,
  Building2,
  CalendarDays,
  CreditCard,
  FlaskConical,
  Home,
  LogOut,
  Package,
  Pill,
  Scan,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import type { NavEntry } from '../components/layout/Sidebar'
import { AppHeader } from '../components/layout/AppHeader'
import { BottomNav } from '../components/layout/BottomNav'
import { ToastHost } from '../components/ui/Toasts'
import { useApp } from '../stores/AppStore'
import { useAuth } from '../stores/AuthStore'
import { cn } from '../lib/cn'

function navCls(isActive: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-gray-50 hover:text-ink',
  )
}

export function PatientLayout() {
  const { t, unreadCount } = useApp()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const items: NavEntry[] = [
    { to: '/patient', label: t('nav.home'), icon: Home, end: true },
    { to: '/patient/doctors', label: t('nav.doctors'), icon: Stethoscope },
    { to: '/patient/hospitals', label: t('nav.hospitals'), icon: Building2 },
    { to: '/patient/pharmacies', label: t('nav.pharmacies'), icon: Pill },
    { to: '/patient/laboratories', label: t('nav.laboratories'), icon: FlaskConical },
    { to: '/patient/imaging', label: t('nav.imaging'), icon: Scan },
    { to: '/patient/nurses', label: t('nav.nurses'), icon: UserRound },
    { to: '/patient/ambulance', label: t('nav.ambulance'), icon: AmbulanceIcon },
    { to: '/patient/delivery', label: t('nav.delivery'), icon: Package },
    { to: '/patient/appointments', label: t('nav.appointments'), icon: CalendarDays },
    { to: '/patient/payments', label: t('nav.payments'), icon: CreditCard },
  ]

  const footer = (
    <div className="space-y-1">
      <NavLink to="/patient/notifications" className={({ isActive }) => navCls(isActive)}>
        <span className="min-w-0 flex-1 truncate">{t('nav.notifications')}</span>
        {unreadCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </NavLink>
      <NavLink to="/patient/profile" className={({ isActive }) => navCls(isActive)}>
        <span className="min-w-0 flex-1 truncate">{t('nav.profile')}</span>
      </NavLink>
      <button
        onClick={() => { logout(); navigate('/login') }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-5 w-5" /> {t('nav.logout')}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Sidebar items={items} footer={footer} />
      <div className="lg:pl-64">
        <AppHeader />
        <main className="pb-24 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <ToastHost />
    </div>
  )
}