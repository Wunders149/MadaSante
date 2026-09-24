import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Step {
  label: string
  current?: boolean
  done?: boolean
  tone?: 'brand' | 'red'
}

interface Props {
  steps: Step[]
}

export function ProgressTracker({ steps }: Props) {
  const activeIndex = steps.findIndex((s) => s.current || !s.done)
  const lastDoneIndex = activeIndex === -1 ? steps.length - 1 : activeIndex
  return (
    <ol className="flex w-full items-start" aria-label="Progression">
      {steps.map((step, i) => {
        const isDone = step.done || i < lastDoneIndex
        const isCurrent = step.current || i === lastDoneIndex
        const isRed = step.tone === 'red'
        const circleClass = isDone
          ? isRed
            ? 'bg-red-600 text-white'
            : 'bg-brand-600 text-white'
          : 'border-2 border-gray-300 bg-card text-gray-400'
        const lineClass = isDone ? 'bg-brand-600' : 'bg-gray-300'
        return (
          <li key={step.label} className={cn('relative flex flex-1 flex-col items-center gap-1.5', i > 0 && 'min-w-0')}>
            <span
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold',
                circleClass,
                isCurrent && 'ring-4 ring-brand-100',
              )}
              aria-hidden
            >
              {isDone ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'w-full truncate text-center text-[11px] font-medium leading-tight',
                isCurrent ? 'text-ink' : isDone ? 'text-brand-700' : 'text-gray-400',
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span className={cn('absolute left-1/2 top-4 h-0.5 w-full', lineClass)} aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}