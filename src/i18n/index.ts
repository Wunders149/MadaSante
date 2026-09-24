import type { Lang } from '../types'
import { fr } from './fr'
import { en } from './en'
import { mg } from './mg'

const dicts: Record<Lang, Record<string, string>> = { fr, en, mg }

export type { Lang }

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const value = dicts[lang]?.[key] ?? dicts.fr[key] ?? key
  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_m, k: string) => String(params[k] ?? `{${k}}`))
}