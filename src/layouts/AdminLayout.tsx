import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardCheck, LogOut, ShieldCheck, UserCog } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { LangSwitch } from '../components/LangSwitch'
import type { NavEntry } from '../components/layout/Sidebar'
import { ToastHost } from '../components/ui/Toasts'
import { Avatar } from '../components/Avatar'
import { useApp } from '../stores/AppStore'
import { useAuth } from '../stores/AuthStore'
import { cn } from '../lib/cn'
import { Button } from '../components/ui/Button'

function navCls(isActive: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-gray-50 hover:text-ink',
  )
}

export function AdminLayout() {
  const { t } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const items: NavEntry[] = [
    { to: '/admin', label: t('admin.applications'), icon: ClipboardCheck, end: true },
    { to: '/admin/profile', label: t('admin.profile'), icon: UserCog },
  ]

  const footer = (
    <div className="space-y-1">
      <div className="px-1 pb-2">
        <LangSwitch />
      </div>
      <NavLink to="/patient" className={({ isActive }) => navCls(isActive)}>
        <ShieldCheck className="h-5 w-5 text-ink-faint" />
        <span className="min-w-0 flex-1 truncate">{t('nav.patientArea')}</span>
      </NavLink>
      <button
        onClick={() => setShowLogout(true)}
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

      {showLogout && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4" onClick={() => setShowLogout(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">{t('nav.logout')} ?</h3>
            <p className="mt-1 text-sm text-ink-soft">{t('profile.logoutDesc')}</p>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowLogout(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  setShowLogout(false)
                  logout()
                  navigate('/login')
                }}
              >
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}