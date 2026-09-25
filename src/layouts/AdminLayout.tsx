import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardCheck, LogOut, ShieldCheck } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import type { NavEntry } from '../components/layout/Sidebar'
import { ToastHost } from '../components/ui/Toasts'
import { Logo } from '../components/Logo'
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

export function AdminLayout() {
  const { t } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items: NavEntry[] = [
    { to: '/admin', label: t('admin.applications'), icon: ClipboardCheck, end: true },
  ]

  const footer = (
    <div className="space-y-1">
      <NavLink to="/patient" className={({ isActive }) => navCls(isActive)}>
        <ShieldCheck className="h-5 w-5 text-ink-faint" />
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
        <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="hidden lg:block">
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
        <main className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  )
}