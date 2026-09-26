import { Search } from 'lucide-react'
import { cn } from '../lib/cn'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Accessible name for the input; falls back to the placeholder. */
  ariaLabel?: string
  size?: 'md' | 'lg'
  className?: string
  autoFocus?: boolean
  onSubmit?: () => void
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
  size = 'lg',
  className,
  autoFocus,
  onSubmit,
}: Props) {
  return (
    <form
      className={cn('relative w-full', className)}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <Search
        className={cn(
          'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint',
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
        )}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full rounded-2xl border border-line bg-card pl-11 pr-4 font-medium text-ink shadow-card outline-none transition placeholder:font-normal placeholder:text-ink-faint focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
          size === 'lg' ? 'min-h-14 text-base' : 'min-h-11 text-sm',
          className,
        )}
      />
    </form>
  )
}