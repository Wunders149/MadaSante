import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

interface Props {
  title: string
  description?: string
  icon: LucideIcon
  to: string
  tone?: 'brand' | 'blue' | 'red' | 'orange' | 'amber'
  compact?: boolean
}

const toneBg: Record<NonNullable<Props['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-700 group-hover:bg-brand-600 group-hover:text-white',
  blue: 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
  red: 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white',
  orange: 'bg-orange-50 text-orange-600 group-hover:bg-om group-hover:text-white',
  amber: 'bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white',
}

export function ServiceCard({ title, description, icon: Icon, to, tone = 'brand', compact }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        'group card touch-target flex items-center gap-3 p-4 transition-colors hover:border-brand-300 hover:shadow-soft',
        compact && 'p-3',
      )}
    >
      <span className={cn('grid min-h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors', toneBg[tone])}>
        <Icon className="h-5.5 w-5.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block font-semibold text-ink', compact ? 'text-sm' : 'text-[15px]')}>{title}</span>
        {description && !compact && <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{description}</span>}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}