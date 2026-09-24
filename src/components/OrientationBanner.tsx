import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Compass } from 'lucide-react'
import { Button } from './ui/Button'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  compact?: boolean
}

export function OrientationBanner({ title, description, icon: Icon = Compass, actionLabel, actionTo, onAction, compact }: Props) {
  return (
    <section className="card relative overflow-hidden border-brand-200 bg-brand-softer p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-100/60" />
      <div className="pointer-events-none absolute -bottom-14 left-24 h-28 w-28 rounded-full bg-brand-100/40" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700">
            <Compass className="h-3.5 w-3.5" />
            Mada Santé
          </div>
          {compact ? (
            <p className="mt-1 text-sm font-semibold leading-snug text-ink">{title}</p>
          ) : (
            <h3 className="mt-1 text-base font-bold leading-snug text-ink sm:text-lg">{title}</h3>
          )}
          {description && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</p>}
        </div>
        {(actionLabel && (actionTo || onAction)) && (
          <Button
            to={actionTo}
            onClick={onAction}
            className="shrink-0 self-start sm:self-center"
          >
            {actionLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </section>
  )
}