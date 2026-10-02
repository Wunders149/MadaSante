import { io, type Socket } from 'socket.io-client'
import type { Appointment, DeliveryOrder, EmergencyRequest, NotificationItem } from '../types'

let socket: Socket | null = null
let socketToken: string | null = null

/**
 * Initialize the Socket.IO client.
 *
 * The token is passed for authentication. The server verifies it and
 * joins the socket to the appropriate rooms.
 */
export function initSocket(token: string): Socket {
  if (socket && socketToken === token) return socket
  disconnectSocket()

  socketToken = token
  socket = io({
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected')
  })

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected')
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message)
  })

  return socket
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
  socketToken = null
}

function subscribe<T>(event: string, callback: (data: T) => void): () => void {
  const activeSocket = socket
  activeSocket?.on(event, callback)
  return () => activeSocket?.off(event, callback)
}

/**
 * Subscribe to appointment updates.
 */
export function onAppointmentUpdated(callback: (data: Appointment) => void): () => void {
  return subscribe('appointment.updated', callback)
}

export function onAppointmentCreated(callback: (data: Appointment) => void): () => void {
  return subscribe('appointment.new', callback)
}

/**
 * Subscribe to emergency updates.
 */
export function onEmergencyUpdated(callback: (data: Partial<EmergencyRequest> & Pick<EmergencyRequest, 'id' | 'reference' | 'status'>) => void): () => void {
  return subscribe('emergency.updated', callback)
}

/**
 * Subscribe to delivery updates.
 */
export function onDeliveryUpdated(callback: (data: Partial<DeliveryOrder> & Pick<DeliveryOrder, 'id' | 'reference' | 'status'>) => void): () => void {
  return subscribe('delivery.updated', callback)
}

/**
 * Subscribe to payment updates.
 */
export function onPaymentUpdated(callback: (data: { paymentId: string; reference: string; status: string; amount: number; method: string }) => void): () => void {
  return subscribe('payment.updated', callback)
}

/**
 * Subscribe to new notifications.
 */
export function onNotificationCreated(callback: (data: NotificationItem) => void): () => void {
  return subscribe('notification.created', callback)
}

export function onRequestCreated(callback: (data: { type: 'medication' | 'home'; id: string; reference: string }) => void): () => void {
  return subscribe('request.created', callback)
}

export function onRequestUpdated(callback: (data: { type: 'medication' | 'home'; id: string; status: string }) => void): () => void {
  return subscribe('request.updated', callback)
}

export function onMessageCreated(callback: (data: { conversationId: string }) => void): () => void {
  return subscribe('message.created', callback)
}

/**
 * Subscribe to new emergency requests (for ambulance providers).
 */
export function onNewEmergency(callback: (data: { id: string; reference: string; location: string; emergencyType: string; destinationHospital: string }) => void): () => void {
  return subscribe('emergency.new', callback)
}

/**
 * Subscribe to new delivery requests (for pharmacy providers).
 */
export function onNewDelivery(callback: (data: { id: string; reference: string }) => void): () => void {
  return subscribe('delivery.new', callback)
}
