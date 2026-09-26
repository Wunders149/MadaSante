import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface TabOption<T extends string> {
  key: T
  label: string
  icon?: LucideIcon
  count?: number
}

/**
 * Segmented control used for view switches (upcoming / past, all / pending).
 * Renders as a single radio group so arrow-key navigation and screen readers
 * announce it as one control rather than a row of loose buttons.
 */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T
  onChange: (key: T) => void
  options: TabOption<T>[]
  ariaLabel?: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-1 rounded-2xl border border-line bg-gray-100 p-1', className)}
    >
      {options.map(({ key, label, icon: Icon, count }) => {
        const active = key === value
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
              active ? 'bg-card text-brand-700 shadow-sm' : 'text-ink-soft hover:text-ink',
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span className="truncate">{label}</span>
            {count !== undefined && (
              <span className={cn('text-xs font-bold', active ? 'text-brand-600' : 'text-ink-faint')}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Rounded filter chips with live counts, used by the admin moderation queue.
 * Unlike SegmentedTabs these are not a single-select view switch, so they stay
 * as independent pressed-state buttons.
 */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T
  onChange: (key: T) => void
  options: TabOption<T>[]
  ariaLabel?: string
  className?: string
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map(({ key, label, count }) => {
        const active = key === value
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
              active
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line bg-card text-ink-soft hover:border-brand-300 hover:text-ink',
            )}
          >
            {label}
            {count !== undefined && <span className="ml-1.5 opacity-70">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
