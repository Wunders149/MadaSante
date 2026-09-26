import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  CalendarDays,
  Clock,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  UserRound,
} from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { LangSwitch } from '../components/LangSwitch'
import type { NavEntry } from '../components/layout/Sidebar'
import { ToastHost } from '../components/ui/Toasts'
import { Avatar } from '../components/Avatar'
import { useApp } from '../stores/AppStore'
import { useAuth } from '../stores/AuthStore'
import { cn } from '../lib/cn'

function navCls(isActive: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-gray-50 hover:text-ink',
  )
}

export function ProviderLayout() {
  const { t } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items: NavEntry[] = [
    { to: '/provider', label: t('prov.dashboard'), icon: Home, end: true },
    { to: '/provider/appointments', label: t('prov.appointments'), icon: CalendarDays },
    { to: '/provider/availability', label: t('prov.availability'), icon: Clock },
    { to: '/provider/requests', label: t('prov.requests'), icon: ClipboardList },
    { to: '/provider/payments', label: t('prov.payments'), icon: CreditCard },
    { to: '/provider/profile', label: t('prov.profile'), icon: UserRound },
  ]

  const footer = (
    <div className="space-y-1">
      <div className="px-1 pb-2">
        <LangSwitch />
      </div>
      <NavLink to="/patient" className={({ isActive }) => navCls(isActive)}>
        <ArrowLeftRight className="h-5 w-5 text-ink-faint" />
        <span className="min-w-0 flex-1 truncate">{t('nav.patientArea')}</span>
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
        <MobileNav area="provider" />
        <header className="sticky top-0 z-30 hidden border-b border-line bg-page/90 backdrop-blur lg:block">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-ink">{t('prov.title')}</h1>
              <p className="text-xs text-ink-faint">Rôle : {roleLabel(user?.role)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 sm:inline">
                {roleLabel(user?.role)}
              </span>
              <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} src={user?.photo} size="sm" />
            </div>
          </div>
        </header>
        <main className="px-4 pb-48 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  )
}

function roleLabel(role?: string): string {
  if (!role) return '—'
  const map: Record<string, string> = {
    doctor: 'Médecin',
    nurse: 'Infirmière',
    pharmacy: 'Pharmacie',
    laboratory: 'Laboratoire',
    imaging_center: 'Imagerie',
    hospital: 'Hôpital',
    ambulance_driver: 'Ambulance',
  }
  return map[role] ?? role
}