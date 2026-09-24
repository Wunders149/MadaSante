import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Props {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  hideClose?: boolean
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-full h-full rounded-none sm:rounded-2xl sm:max-h-[92vh]',
}

export function Modal({ open, onClose, title, children, footer, size = 'md', hideClose }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-lifted animate-fade-up sm:rounded-2xl',
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="text-base font-semibold text-ink">{title}</div>
          {!hideClose && (
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-gray-100"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer && (
          <div className="border-t border-line bg-brand-softer/60 px-5 py-3.5">{footer}</div>
        )}
      </div>
    </div>
  )
}