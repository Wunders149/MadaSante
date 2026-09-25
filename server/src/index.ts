import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import type { NextFunction, Request, Response } from 'express'
import { config } from './config.js'
import { db, migrate } from './db.js'
import { seed } from './seed.js'
import { authRouter } from './routes/auth.js'
import { catalogRouter } from './routes/catalog.js'
import { searchRouter } from './routes/search.js'
import { appointmentsRouter } from './routes/appointments.js'
import { paymentsRouter } from './routes/payments.js'
import { notificationsRouter } from './routes/notifications.js'
import { providersRouter } from './routes/providers.js'
import { deliveriesRouter } from './routes/deliveries.js'
import { emergencyRouter } from './routes/emergency.js'

migrate()
seed()

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api', catalogRouter)
app.use('/api', searchRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/providers', providersRouter)
app.use('/api/deliveries', deliveriesRouter)
app.use('/api/emergency-requests', emergencyRouter)

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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Erreur serveur' })
})

app.listen(config.port, () => {
  console.log(`Mada Sante API listening on http://localhost:${config.port}`)
})

void db