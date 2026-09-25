import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from './config.js'

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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    req.auth = jwt.verify(token, config.jwtSecret) as AuthUser
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

export function requireProvider(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role === 'patient') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}