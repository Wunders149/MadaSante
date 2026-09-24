import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { LogoMark } from '../Logo'
import { cn } from '../../lib/cn'

export interface NavEntry {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
  end?: boolean
}

interface Props {
  items: NavEntry[]
  footer?: React.ReactNode
}

export function Sidebar({ items, footer }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-card lg:flex">
      <div className="flex h-full flex-col overflow-y-auto scrollbar-thin">
        <div className="flex-none px-5 pb-4 pt-6">
          <SidebarBrand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Navigation principale">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-ink-soft hover:bg-gray-50 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn('h-5 w-5 shrink-0', isActive ? 'text-brand-600' : 'text-ink-faint group-hover:text-brand-600')}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        {footer && <div className="flex-none border-t border-line p-3">{footer}</div>}
      </div>
    </aside>
  )
}

export function SidebarBrand() {
  return (
    <NavLink to="/patient" className="flex items-center gap-2.5 rounded-xl px-1 py-1">
      <LogoMark className="h-9 w-9" />
      <span className="leading-none">
        <span className="block text-base font-extrabold tracking-tight text-ink">Mada&nbsp;Santé</span>
        <span className="mt-0.5 block text-[11px] font-medium text-brand-600">manampy anao</span>
      </span>
    </NavLink>
  )
}