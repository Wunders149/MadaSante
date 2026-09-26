import type { NextFunction, Request, Response } from 'express'

/**
 * Fixed-window rate limiter, in-process.
 *
 * Deliberately dependency-free: this is a single-instance app on Render's free
 * plan, and the goal is to blunt credential stuffing and the bcrypt cost
 * behind it, not to be a distributed quota. A shared store (Redis) would be
 * the next step if this ever runs multi-instance.
 *
 * bcrypt is deliberately expensive, so an unthrottled login endpoint is both a
 * brute-force surface and a mild event-loop denial of service. Limiting here is
 * the cheapest real mitigation.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Drop expired buckets so the map cannot grow without bound. */
function sweep(now: number) {
  if (buckets.size < 5_000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number
  /** Requests allowed per window. */
  max: number
  /** Override the bucket key. Defaults to IP + method + path. */
  keyFor?: (req: Request) => string
  message?: string
}

export function rateLimit({ windowMs, max, keyFor, message }: RateLimitOptions) {
  const key = keyFor ?? ((req: Request) => `${req.ip}|${req.method}|${req.path}`)

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    sweep(now)

    const id = key(req)
    let bucket = buckets.get(id)
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(id, bucket)
    }
    bucket.count += 1

    const remaining = Math.max(0, max - bucket.count)
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(remaining))
    res.setHeader('RateLimit-Reset', String(Math.ceil((bucket.resetAt - now) / 1000)))

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      res.status(429).json({
        error: message ?? `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`,
      })
      return
    }
    next()
  }
}

/** Test seam: clears all counters. */
export function resetRateLimits() {
  buckets.clear()
}
