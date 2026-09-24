import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'emergency'
  | 'pay'
type Size = 'sm' | 'md' | 'lg' | 'xl'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-55 disabled:pointer-events-none select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-brand-50 text-brand-800 hover:bg-brand-100 active:bg-brand-200',
  ghost: 'text-brand-700 hover:bg-brand-50 active:bg-brand-100',
  outline: 'border border-line bg-card text-ink hover:border-brand-300 hover:bg-brand-soft/50',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  emergency: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 animate-pulse-ring',
  pay: 'bg-om text-white hover:brightness-105 active:brightness-95 shadow-sm',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-2 min-h-9',
  md: 'text-sm px-4 py-2.5 min-h-11',
  lg: 'text-base px-5 py-3 min-h-12',
  xl: 'text-lg px-6 py-4 min-h-14 w-full sm:w-auto',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  to?: string
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  to,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}