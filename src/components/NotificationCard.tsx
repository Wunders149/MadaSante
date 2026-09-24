import { BellRing, CalendarCheck, AlertTriangle, CreditCard, Package, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { NotificationCategory, NotificationItem } from '../types'
import { useApp } from '../stores/AppStore'
import { formatDateTime } from '../lib/format'
import { cn } from '../lib/cn'

const catConfig: Record<NotificationCategory, { icon: typeof BellRing; cls: string }> = {
  appointment: { icon: CalendarCheck, cls: 'bg-brand-50 text-brand-700' },
  payment: { icon: CreditCard, cls: 'bg-om/10 text-om' },
  delivery: { icon: Package, cls: 'bg-blue-50 text-blue-700' },
  emergency: { icon: AlertTriangle, cls: 'bg-red-50 text-red-600' },
  system: { icon: Info, cls: 'bg-slate-100 text-slate-600' },
}

export function NotificationCard({ item }: { item: NotificationItem }) {
  const { t, markNotificationRead } = useApp()
  const cfg = catConfig[item.category]
  const Icon = cfg.icon

  const content = (
    <div
      className={cn(
        'card flex w-full items-start gap-3 p-4 text-left transition hover:shadow-soft',
        !item.read && 'border-brand-200 bg-brand-softer',
      )}
      onClick={() => markNotificationRead(item.id)}
    >
      <span className={cn('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl', cfg.cls)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">{item.title}</p>
          {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label={t('notif.unread')} />}
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">{item.message}</p>
        <p className="mt-1 text-xs text-ink-faint">{formatDateTime(item.createdAt)}</p>
      </div>
    </div>
  )

  if (item.link) {
    return (
      <Link to={item.link} className="block">
        {content}
      </Link>
    )
  }
  return content
}

export function NotificationBell({ onClick }: { onClick: () => void }) {
  const { unreadCount } = useApp()
  return (
    <button
      onClick={onClick}
      className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink-soft shadow-sm transition hover:text-brand-700"
      aria-label="Notifications"
    >
      <BellRing className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
          {unreadCount}
        </span>
      )}
    </button>
  )
}