import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import type { NextFunction, Request, Response } from 'express'
import { config } from './config.js'
import { migrate } from './db.js'
import { ensureAdmin } from './seed.js'
import { authRouter } from './routes/auth.js'
import { catalogRouter } from './routes/catalog.js'
import { searchRouter } from './routes/search.js'
import { appointmentsRouter } from './routes/appointments.js'
import { paymentsRouter } from './routes/payments.js'
import { notificationsRouter } from './routes/notifications.js'
import { providersRouter, providersRouterPublic } from './routes/providers.js'
import { deliveriesRouter } from './routes/deliveries.js'
import { emergencyRouter } from './routes/emergency.js'
import { adminRouter } from './routes/admin.js'

await migrate()
await ensureAdmin()

const app = express()

app.use(cors())
app.use(express.json({ limit: '6mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api', catalogRouter)
app.use('/api', searchRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/providers', providersRouterPublic)
app.use('/api/providers', providersRouter)
app.use('/api/deliveries', deliveriesRouter)
app.use('/api/emergency-requests', emergencyRouter)
app.use('/api/admin', adminRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const indexFile = path.join(config.clientDist, 'index.html')
if (fs.existsSync(indexFile)) {
  app.use(express.static(config.clientDist))
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    res.sendFile(indexFile)
  })
}

/**
 * Error message that is safe to hand back to the client: the real reason the
 * request failed (so the UI can show it), minus anything credential-shaped,
 * truncated to keep responses bounded. The full stack stays in the logs.
 */
function publicErrorMessage(err: Error): string {
  const message = (err.message || '').trim() || 'Erreur serveur'
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgres://***')
    .replace(/(password\s*=\s*)\S+/gi, '$1***')
    .slice(0, 300)
}

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  if (res.headersSent) {
    next(err)
    return
  }
  res.status(500).json({ error: publicErrorMessage(err) })
})

app.listen(config.port, () => {
  console.log(`Mada Sante API listening on http://localhost:${config.port}`)
})