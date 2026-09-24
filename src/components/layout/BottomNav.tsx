import { NavLink } from 'react-router-dom'
import { CalendarDays, Home, Search, User } from 'lucide-react'
import { useApp } from '../../stores/AppStore'
import { cn } from '../../lib/cn'

const items = [
  { to: '/patient', label: 'nav.home', icon: Home, end: true },
  { to: '/patient/search', label: 'nav.search', icon: Search },
  { to: '/patient/appointments', label: 'nav.appointments', icon: CalendarDays },
  { to: '/patient/profile', label: 'nav.profile', icon: User },
]

export function BottomNav() {
  const { t } = useApp()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigation mobile"
    >
      <div className="grid grid-cols-4">
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
                    'grid h-8 w-12 place-items-center rounded-full transition-colors',
                    isActive && 'bg-brand-50',
                  )}
                >
                  <item.icon className="h-5.5 w-5.5" />
                </span>
                {t(item.label)}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}