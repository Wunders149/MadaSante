import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth)

type Row = Record<string, unknown>

const mapNotification = (r: Row) => ({
  id: r.id,
  title: r.title,
  message: r.message,
  category: r.category,
  read: r.read === 1,
  createdAt: r.created_at,
  link: r.link ?? undefined,
})

notificationsRouter.get('/', (req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.auth!.id) as Row[]
  res.json(rows.map(mapNotification))
})

const createSchema = z.object({
  title: z.string(),
  message: z.string().optional(),
  category: z.enum(['appointment', 'payment', 'delivery', 'emergency', 'system']),
  link: z.string().optional(),
})

notificationsRouter.post('/', (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const input = parsed.data
  const notification = {
    id: `notif-${Date.now()}`,
    userId: req.auth!.id,
    title: input.title,
    message: input.message ?? '',
    category: input.category,
    read: 0,
    createdAt: new Date().toISOString(),
    link: input.link ?? null,
  }
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, category, read, created_at, link)
    VALUES (@id, @userId, @title, @message, @category, @read, @createdAt, @link)
  `).run(notification)
  res.status(201).json(mapNotification(notification))
})

notificationsRouter.patch('/:id/read', (req: Request, res: Response) => {
  const result = db
    .prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.auth!.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Notification introuvable' })
    return
  }
  res.json({ ok: true })
})

notificationsRouter.patch('/read-all', (req: Request, res: Response) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.auth!.id)
  res.json({ ok: true })
})