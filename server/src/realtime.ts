import { Server as HttpServer } from 'node:http'
import { Server, type Socket } from 'socket.io'
import { config } from './config.js'
import { db } from './db.js'

let io: Server | null = null

/**
 * Socket.IO real-time event bus.
 *
 * Events emitted:
 *  - appointment.updated  → appointment status changed
 *  - request.accepted     → provider accepted a request
 *  - request.rejected     → provider rejected a request
 *  - ambulance.dispatched → ambulance assigned to emergency
 *  - delivery.assigned     → delivery person assigned
 *  - delivery.updated     → delivery status changed
 *  - payment.updated      → payment status changed
 *  - notification.created  → new notification for a user
 */
export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: config.isProduction
        ? (config.corsOrigins.length > 0 ? config.corsOrigins : false)
        : true,
      methods: ['GET', 'POST'],
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Unauthorized'))
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jwt = require('jsonwebtoken')
      const claims = jwt.verify(token, config.jwtSecret) as { id: string }
      void db.query('SELECT id, role, provider_id FROM users WHERE id = $1', [claims.id])
        .then((result) => {
          const user = result.rows[0] as { id: string; role: string; provider_id: string | null } | undefined
          if (!user) {
            next(new Error('Unauthorized'))
            return
          }
          socket.data.userId = user.id
          socket.data.role = user.role
          socket.data.providerId = user.provider_id
          next()
        })
        .catch(() => next(new Error('Unauthorized')))
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string
    const role = socket.data.role as string

    // Join a personal room for direct notifications
    socket.join(`user:${userId}`)

    socket.join(`role:${role}`)

    const providerId = socket.data.providerId as string | null | undefined
    if (providerId) socket.join(`provider:${providerId}`)

    // Ambulance drivers join the emergency dispatch room
    if (role === 'ambulance_driver') {
      socket.join('ambulance:dispatch')
    }

    // Admins join the admin monitoring room
    if (role === 'admin') {
      socket.join('admin:monitor')
    }

    socket.on('disconnect', () => {
      // Socket.IO handles room cleanup automatically
    })
  })

  return io
}

export function getIO(): Server | null {
  return io
}

/**
 * Emit an event to a specific user's room.
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data)
}

export function emitToProvider(providerId: string, event: string, data: unknown): void {
  io?.to(`provider:${providerId}`).emit(event, data)
}

export function emitToRoles(roles: string[], event: string, data: unknown): void {
  io?.to(roles.map((role) => `role:${role}`)).emit(event, data)
}

/**
 * Emit an event to all connected clients (broadcast).
 */
export function emitBroadcast(event: string, data: unknown): void {
  io?.emit(event, data)
}

/**
 * Emit an event to the ambulance dispatch room.
 */
export function emitToAmbulanceDispatch(event: string, data: unknown): void {
  io?.to('ambulance:dispatch').emit(event, data)
}

/**
 * Emit an event to the admin monitoring room.
 */
export function emitToAdminMonitor(event: string, data: unknown): void {
  io?.to('admin:monitor').emit(event, data)
}

