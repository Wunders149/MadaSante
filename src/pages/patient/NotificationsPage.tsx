import { Bell, CheckCheck } from 'lucide-react'
import { PageHeader } from '../../components/ui/Headers'
import { NotificationCard } from '../../components/NotificationCard'
import { EmptyState } from '../../components/ui/States'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useApp } from '../../stores/AppStore'

export function NotificationsPage() {
  const { t, notifications, unreadCount, markAllNotificationsRead } = useApp()

  return (
    <div className="page-container max-w-2xl py-5 sm:py-7">
      <PageHeader title={t('notif.title')} subtitle={t('notif.subtitle')} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-soft">
          {unreadCount > 0 ? `${unreadCount} ${t('notif.unread')}` : t('common.all')}
        </p>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => markAllNotificationsRead()}>
            <CheckCheck className="h-4 w-4" /> {t('notif.markAll')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={t('notif.empty')}
            description={t('notif.emptyDesc')}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              item={n}
            />
          ))}
        </div>
      )}

      <div className="mt-4">
        <Badge tone="slate">{`${notifications.length} ${t('common.total')}`}</Badge>
      </div>
    </div>
  )
}
