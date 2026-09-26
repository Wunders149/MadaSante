import { NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, ClipboardCheck, Home, LogOut, User } from 'lucide-react'
import { Logo } from '../Logo'
import { Avatar } from '../Avatar'
import { LangSwitch } from '../LangSwitch'
import { useApp } from '../../stores/AppStore'
import { useAuth } from '../../stores/AuthStore'
import { cn } from '../../lib/cn'

export type MobileNavArea = 'provider' | 'admin'

interface BarItem {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}

const AREA_ITEMS: Record<MobileNavArea, BarItem[]> = {
  provider: [
    { to: '/provider', label: 'nav.home', icon: Home, end: true },
    { to: '/provider/appointments', label: 'nav.appointments', icon: CalendarDays },
    { to: '/provider/requests', label: 'prov.requests', icon: ClipboardCheck },
    { to: '/provider/profile', label: 'nav.profile', icon: User },
  ],
  admin: [
    { to: '/admin', label: 'admin.applications', icon: ClipboardCheck, end: true },
    { to: '/admin/profile', label: 'nav.profile', icon: User },
  ],
}

interface Props {
  area: MobileNavArea
}

export function MobileNav({ area }: Props) {
  const { t, unreadCount } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = AREA_ITEMS[area]

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo compact />
          <div className="flex items-center gap-2">
            <LangSwitch />
            <button
              onClick={() => navigate(`${area === 'admin' ? '/admin' : '/provider'}/profile`)}
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card shadow-sm"
              aria-label={t('nav.profile')}
            >
              <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} src={user?.photo} size="xs" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label={t('prov.title')}
      >
        <div className={cn('grid', items.length === 2 ? 'grid-cols-2' : 'grid-cols-4')}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-brand-700' : 'text-ink-faint',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'relative grid h-8 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-brand-50',
                    )}
                  >
                    <item.icon className="h-5.5 w-5.5" />
                    {item.to === '/provider/requests' && unreadCount > 0 && (
                      <span className="absolute -top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  {t(item.label)}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="flex w-full items-center justify-center gap-2 border-t border-line py-2 text-xs font-semibold text-ink-faint transition-colors hover:text-red-600"
        >
          <LogOut className="h-4 w-4" /> {t('nav.logout')}
        </button>
      </nav>
    </>
  )
}
