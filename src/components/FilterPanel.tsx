import { useState } from 'react'
import type { ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useApp } from '../stores/AppStore'
import { cn } from '../lib/cn'

interface Props {
  label?: string
  badge?: number
  onApply?: () => void
  onReset?: () => void
  children: ReactNode
  className?: string
}

export function FilterPanel({ label, badge = 0, onApply, onReset, children, className }: Props) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const title = label ?? t('common.filters')

  const reset = () => {
    onReset?.()
  }

  return (
    <>
      <Button
        variant="outline"
        size="md"
        onClick={() => setOpen(true)}
        className={cn('relative', className)}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {title}
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        size="sm"
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              {t('common.reset')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onApply?.()
                setOpen(false)
              }}
            >
              {t('common.apply')}
            </Button>
          </div>
        }
      >
        {children}
      </Modal>
    </>
  )
}

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="py-2 first:pt-0">
      <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">{title}</legend>
      {children}
    </fieldset>
  )
}

interface ChipProps {
  active?: boolean
  children: ReactNode
  onClick: () => void
}

export function FilterChip({ active, children, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm font-semibold transition',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-line bg-card text-ink-soft hover:border-brand-300',
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
