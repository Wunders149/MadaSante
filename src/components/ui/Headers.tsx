import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  title: string
  subtitle?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  icon?: LucideIcon
}

export function SectionHeader({ title, subtitle, actionLabel, actionTo, onAction, icon: Icon }: Props) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        {Icon && (
          <span className="mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {(actionTo || onAction) && (
        actionTo ? (
          <Link
            to={actionTo}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-1 py-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
          >
            {actionLabel} <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-1 py-2 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
          >
            {actionLabel} <ChevronRight className="h-4 w-4" />
          </button>
        )
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft sm:text-base">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}