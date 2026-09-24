import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} aria-hidden />
}

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50">
        <Spinner className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-ink-soft">{label}</p>
    </div>
  )
}

interface StateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink">{title ?? 'Aucun résultat'}</p>
      {description && <p className="max-w-xs text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Une erreur est survenue.', action }: { title?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}