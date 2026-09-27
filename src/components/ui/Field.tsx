import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useApp } from '../../stores/AppStore'

const controlBase =
  'w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50 disabled:text-ink-faint'

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
      {children}
    </label>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className, ...rest }: InputProps) {
  return (
    <div className="w-full">
      {label && <Label>{label}</Label>}
      <input className={cn(controlBase, className)} {...rest} />
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  /** Show the requirements hint while the field is empty. */
  showHint?: boolean
  /** Show the strength meter (meaningless for an existing password). */
  showMeter?: boolean
  /**
   * Live "passwords match / don't match" feedback. Pass the value of the
   * other password field; omit it on the first field of a pair.
   */
  compareTo?: string
}

/**
 * A password input with a show/hide toggle, a small strength meter and live
 * match feedback. Passwords are the one field where users type blind: the
 * toggle fixes that, the meter turns the abstract "6 characters" rule into
 * visible progress, and the match line removes a whole class of
 * submit-and-correct loops.
 *
 * Score is the count of satisfied rules: length ≥ 6, lower case, upper case,
 * digit — mirroring the server's current minimum plus cheap set coverage.
 */
export function PasswordInput({
  label,
  showHint = true,
  showMeter = true,
  compareTo,
  className,
  id,
  value,
  ...rest
}: PasswordInputProps) {
  const { t } = useApp()
  const autoId = useId()
  const inputId = id ?? autoId
  const [visible, setVisible] = useState(false)

  const text = typeof value === 'string' ? value : ''
  const score = [
    text.length >= 6,
    /[a-z]/.test(text),
    /[A-Z]/.test(text),
    /\d/.test(text),
  ].filter(Boolean).length
  const band = [
    { min: 1, labelKey: 'weak', bar: 'bg-red-400', text: 'text-red-500' },
    { min: 2, labelKey: 'fair', bar: 'bg-amber-400', text: 'text-amber-600' },
    { min: 3, labelKey: 'good', bar: 'bg-lime-500', text: 'text-lime-600' },
    { min: 4, labelKey: 'strong', bar: 'bg-brand-500', text: 'text-brand-600' },
  ].find((b) => score >= b.min)
  const matches = compareTo === undefined ? undefined : text === compareTo
  const metaId = `${inputId}-meta`
  const hasMeta = showHint || compareTo !== undefined

  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          aria-describedby={hasMeta ? metaId : undefined}
          className={cn(controlBase, 'pr-11', className)}
          {...rest}
        />
        {/* type="button" is what keeps the toggle from submitting the form
            that hosts it. */}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-faint transition hover:bg-gray-100 hover:text-ink"
          aria-label={visible ? t('ui.pw.hide') : t('ui.pw.show')}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hasMeta && (
        <div id={metaId}>
          {showHint && text.length === 0 && (
            <p className="mt-1 text-xs text-ink-faint">{t('ui.pw.hint')}</p>
          )}
          {showMeter && text.length > 0 && band && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex flex-1 gap-1" aria-hidden>
                {[1, 2, 3, 4].map((seg) => (
                  <span
                    key={seg}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-200',
                      score >= seg ? band.bar : 'bg-gray-200',
                    )}
                  />
                ))}
              </div>
              <span className={cn('text-[11px] font-bold', band.text)}>
                {t(`ui.pw.${band.labelKey}`)}
              </span>
            </div>
          )}
          {compareTo !== undefined && text.length > 0 && compareTo.length > 0 && (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-xs font-semibold',
                matches ? 'text-brand-700' : 'text-red-600',
              )}
            >
              {matches ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {t(matches ? 'ui.pw.match' : 'ui.pw.mismatch')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className, children, ...rest }: SelectProps) {
  return (
    <div className="w-full">
      {label && <Label>{label}</Label>}
      <select className={cn(controlBase, 'appearance-none', className)} {...rest}>
        {children}
      </select>
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className, ...rest }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <Label>{label}</Label>}
      <textarea className={cn(controlBase, 'min-h-24 resize-y', className)} {...rest} />
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-brand-600' : 'bg-gray-300',
      )}
    >
      <span
        className={cn(
          'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5.5' : 'translate-x-1',
        )}
      />
    </button>
  )
}