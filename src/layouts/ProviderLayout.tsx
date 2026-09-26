import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
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
import { Sidebar, SidebarLink } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { LangSwitch } from '../components/LangSwitch'
import type { NavEntry } from '../components/layout/Sidebar'
import { ToastHost } from '../components/ui/Toasts'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { Avatar } from '../components/Avatar'
import { useApp } from '../stores/AppStore'
import { useAuth } from '../stores/AuthStore'
import { roleLabelKey } from '../lib/roles'

export function ProviderLayout() {
  const { t } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Translated via the shared role map rather than a hardcoded French table
  // that only this layout knew about.
  const roleName = user?.role ? t(roleLabelKey(user.role)) : '—'

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
      <SidebarLink to="/patient" label={t('nav.patientArea')} icon={ArrowLeftRight} />
      <SidebarLink
        to="/login"
        label={t('nav.logout')}
        icon={LogOut}
        tone="danger"
        onClick={() => setConfirmLogout(true)}
      />
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
              <p className="text-xs text-ink-faint">{roleName}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 sm:inline">
                {roleName}
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

      <ConfirmationModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false)
          logout()
          navigate('/login')
        }}
        title={`${t('nav.logout')} ?`}
        message={t('profile.logoutDesc')}
        confirmLabel={t('nav.logout')}
        cancelLabel={t('common.cancel')}
        tone="danger"
      />
    </div>
  )
}
