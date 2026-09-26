import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { isProviderRole } from './helpers.js'
import { db } from './db.js'

export interface AuthUser {
  id: string
  role: string
  providerId: string | null
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '30d' })
}

/**
 * Verifies the bearer token and then re-reads the account.
 *
 * The token is only proof of identity, not of authority: trusting the `role`
 * and `providerId` claims meant a demoted or stripped account kept full access
 * for the remaining 30 days of the token's life, and a deleted account was
 * treated as merely unauthenticated rather than rejected. One indexed primary
 * key lookup per authenticated request is a fair price for that.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  let claims: AuthUser
  try {
    claims = jwt.verify(token, config.jwtSecret) as AuthUser
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  db.query('SELECT id, role, provider_id FROM users WHERE id = $1', [claims.id])
    .then((result) => {
      const row = result.rows[0] as
        | { id: string; role: string; provider_id: string | null }
        | undefined
      if (!row) {
        // The account was deleted while the token was still valid.
        res.status(401).json({ error: 'Session invalide' })
        return
      }
      req.auth = { id: row.id, role: row.role, providerId: row.provider_id }
      next()
    })
    .catch(() => {
      res.status(500).json({ error: 'Erreur serveur' })
    })
}

export function requireProvider(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || !isProviderRole(req.auth.role)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}