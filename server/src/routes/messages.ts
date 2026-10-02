import { Router } from 'express'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { uniqueId } from '../helpers.js'
import { emitToUser } from '../realtime.js'

export const messagesRouter = Router()
messagesRouter.use(requireAuth)

type Row = Record<string, unknown>

const mapConversation = (r: Row) => ({
  id: r.id,
  patientId: r.patient_id,
  providerId: r.provider_id,
  patientName: r.patient_name,
  providerName: r.provider_name,
  createdAt: r.created_at,
  lastMessage: (r.last_message as string | undefined) ?? undefined,
  lastAt: (r.last_at as string | undefined) ?? undefined,
})

const mapMessage = (r: Row) => ({
  id: r.id,
  conversationId: r.conversation_id,
  senderId: r.sender_id,
  senderRole: r.sender_role,
  text: r.text,
  createdAt: r.created_at,
})

/**
 * List conversations the current user participates in. The "provider_id" is the
 * account id of the professional user, so a provider filters on their own id.
 */
messagesRouter.get('/conversations', async (req: Request, res: Response) => {
  const auth = req.auth!
  const col = auth.role === 'patient' ? 'c.patient_id' : 'c.provider_id'
  const rows = (
    await db.query(
      `SELECT c.*, m.text AS last_message, m.created_at AS last_at
       FROM conversations c
       LEFT JOIN messages m ON m.id = (
         SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
       )
       WHERE ${col} = ? ORDER BY c.created_at DESC`,
      [auth.id],
    )
  ).rows as Row[]
  res.json(rows.map(mapConversation))
})

/**
 * Open (or return the existing) conversation between the patient and a
 * provider account. The provider name is derived server-side from the catalog
 * record, not trusted from the body.
 */
messagesRouter.post('/conversations', async (req: Request, res: Response) => {
  const parsed = z.object({ providerId: z.string().min(1) }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  if (req.auth!.role !== 'patient') {
    res.status(403).json({ error: 'Seuls les patients peuvent ouvrir une conversation' })
    return
  }
  const providerRow = (
    await db.query(
      `SELECT u.id AS user_id, p.name AS provider_name
       FROM users u
       JOIN (
         SELECT id, name FROM doctors
         UNION ALL SELECT id, name FROM nurses
         UNION ALL SELECT id, name FROM pharmacies
         UNION ALL SELECT id, name FROM laboratories
         UNION ALL SELECT id, name FROM imaging_centers
         UNION ALL SELECT id, name FROM hospitals
         UNION ALL SELECT id, provider AS name FROM ambulances
         UNION ALL SELECT id, name FROM practitioners
         UNION ALL SELECT id, name FROM medical_ngos
         UNION ALL SELECT id, name FROM delivery_drivers
       ) p ON p.id = u.provider_id
       WHERE u.provider_id = $1 AND u.role != 'patient' AND u.role != 'admin'
       LIMIT 1`,
      [parsed.data.providerId],
    )
  ).rows[0] as { user_id: string; provider_name: string | null } | undefined
  if (!providerRow) {
    res.status(404).json({ error: 'Professionnel introuvable' })
    return
  }
  const existing = (
    await db.query(
      'SELECT * FROM conversations WHERE patient_id = ? AND provider_id = ? LIMIT 1',
      [req.auth!.id, providerRow.user_id],
    )
  ).rows[0] as Row | undefined
  if (existing) {
    res.json(mapConversation(existing))
    return
  }
  const patient = (await db.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.auth!.id])).rows[0] as
    | { first_name: string; last_name: string }
    | undefined
  const id = uniqueId('conv')
  await db.query(
    'INSERT INTO conversations (id, patient_id, provider_id, patient_name, provider_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [
      id,
      req.auth!.id,
      providerRow.user_id,
      patient ? `${patient.first_name} ${patient.last_name}`.trim() : 'Patient',
      providerRow.provider_name ?? 'Professionnel',
      new Date().toISOString(),
    ],
  )
  const stored = (await db.query('SELECT * FROM conversations WHERE id = $1', [id])).rows[0] as Row
  res.status(201).json(mapConversation(stored))
})

messagesRouter.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  const auth = req.auth!
  const conv = (await db.query('SELECT * FROM conversations WHERE id = ?', [req.params.id])).rows[0] as Row | undefined
  if (!conv) {
    res.status(404).json({ error: 'Conversation introuvable' })
    return
  }
  if (String(conv.patient_id) !== auth.id && String(conv.provider_id) !== auth.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const rows = (
    await db.query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [req.params.id])
  ).rows as Row[]
  res.json(rows.map(mapMessage))
})

messagesRouter.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const parsed = z.object({ text: z.string().min(1).max(2000) }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Payload invalide' })
    return
  }
  const auth = req.auth!
  const conv = (await db.query('SELECT * FROM conversations WHERE id = ?', [req.params.id])).rows[0] as Row | undefined
  if (!conv) {
    res.status(404).json({ error: 'Conversation introuvable' })
    return
  }
  if (String(conv.patient_id) !== auth.id && String(conv.provider_id) !== auth.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const id = uniqueId('msg')
  await db.query(
    'INSERT INTO messages (id, conversation_id, sender_id, sender_role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, conv.id, auth.id, auth.role, parsed.data.text.trim(), new Date().toISOString()],
  )
  // Notify the other participant in real time.
  const otherId = String(conv.patient_id) === auth.id ? String(conv.provider_id) : String(conv.patient_id)
  emitToUser(otherId, 'message.created', { conversationId: conv.id })
  const stored = (await db.query('SELECT * FROM messages WHERE id = $1', [id])).rows[0] as Row
  res.status(201).json(mapMessage(stored))
})
