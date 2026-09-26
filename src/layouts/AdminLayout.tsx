import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ClipboardCheck, LogOut, ShieldCheck, UserCog, Users } from 'lucide-react'
import { Sidebar, SidebarLink } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { LangSwitch } from '../components/LangSwitch'
import type { NavEntry } from '../components/layout/Sidebar'
import { ToastHost } from '../components/ui/Toasts'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { Avatar } from '../components/Avatar'
import { useApp } from '../stores/AppStore'
import { useAuth } from '../stores/AuthStore'

export function AdminLayout() {
  const { t } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const items: NavEntry[] = [
    { to: '/admin', label: t('admin.applications'), icon: ClipboardCheck, end: true },
    { to: '/admin/patients', label: t('admin.patients'), icon: Users },
    { to: '/admin/profile', label: t('admin.profile'), icon: UserCog },
  ]

  const footer = (
    <div className="space-y-1">
      <div className="px-1 pb-2">
        <LangSwitch />
      </div>
      <SidebarLink to="/patient" label={t('nav.patientArea')} icon={ShieldCheck} />
      <SidebarLink to="/login" label={t('nav.logout')} icon={LogOut} tone="danger" onClick={() => setConfirmLogout(true)} />
    </div>
  )

  return (
    <div className="min-h-screen">
      <Sidebar items={items} footer={footer} />
      <div className="lg:pl-64">
        <MobileNav area="admin" />
        <header className="sticky top-0 z-30 hidden border-b border-line bg-page/90 backdrop-blur lg:block">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-ink">{t('admin.title')}</h1>
              <p className="text-xs text-ink-faint">{t('admin.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 sm:inline">
                {t('admin.role')}
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
