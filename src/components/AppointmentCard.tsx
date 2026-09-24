import { CalendarDays, Clock, MapPin } from 'lucide-react'
import type { Appointment } from '../types'
import { useApp } from '../stores/AppStore'
import { Avatar } from './Avatar'
import { StatusBadge } from './ui/StatusBadge'
import { monthDay } from '../lib/format'

const statusTone: Record<Appointment['status'], 'brand' | 'amber' | 'green' | 'red'> = {
  confirmed: 'brand',
  pending: 'amber',
  completed: 'green',
  cancelled: 'red',
}

export function AppointmentCard({ appointment, onOpen }: { appointment: Appointment; onOpen?: () => void }) {
  const { t } = useApp()
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card touch-target flex w-full items-center gap-3 p-4 text-left transition hover:border-brand-300 hover:shadow-soft sm:p-4"
    >
      <Avatar name={appointment.providerName} src={appointment.providerPhoto} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-ink">{appointment.providerName}</p>
        <p className="text-sm text-ink-soft">{appointment.type}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-soft">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-ink-faint" /> {monthDay(appointment.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-ink-faint" /> {appointment.time}
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-ink-faint" /> {appointment.location}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusBadge label={t(`apt.status.${appointment.status}`)} tone={statusTone[appointment.status]} />
        <span className="text-xs font-medium text-ink-faint">{appointment.reference}</span>
      </div>
    </button>
  )
}