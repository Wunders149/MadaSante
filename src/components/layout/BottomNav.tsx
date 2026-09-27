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
  // Same floating pill treatment as the provider/admin MobileNav, so all
  // three areas share one mobile navigation language.
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-label="Navigation mobile"
    >
      <div className="mx-auto max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]">
        <div className="pointer-events-auto flex items-stretch gap-1 rounded-[1.75rem] border border-line bg-card/90 p-1.5 shadow-lifted backdrop-blur-xl">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-faint hover:text-ink-soft',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-8 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-white shadow-sm',
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="truncate">{t(item.label)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}