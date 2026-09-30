import { io, type Socket } from 'socket.io-client'
import type { Appointment, DeliveryOrder, EmergencyRequest, NotificationItem } from '../types'

let socket: Socket | null = null

/**
 * Initialize the Socket.IO client.
 *
 * The token is passed for authentication. The server verifies it and
 * joins the socket to the appropriate rooms.
 */
export function initSocket(token: string): Socket {
  if (socket?.connected) return socket

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
}

/**
 * Subscribe to appointment updates.
 */
export function onAppointmentUpdated(callback: (data: Appointment) => void): () => void {
  socket?.on('appointment.updated', callback)
  return () => socket?.off('appointment.updated', callback)
}

/**
 * Subscribe to emergency updates.
 */
export function onEmergencyUpdated(callback: (data: EmergencyRequest) => void): () => void {
  socket?.on('emergency.updated', callback)
  return () => socket?.off('emergency.updated', callback)
}

/**
 * Subscribe to delivery updates.
 */
export function onDeliveryUpdated(callback: (data: DeliveryOrder) => void): () => void {
  socket?.on('delivery.updated', callback)
  return () => socket?.off('delivery.updated', callback)
}

/**
 * Subscribe to payment updates.
 */
export function onPaymentUpdated(callback: (data: { paymentId: string; reference: string; status: string; amount: number; method: string }) => void): () => void {
  socket?.on('payment.updated', callback)
  return () => socket?.off('payment.updated', callback)
}

/**
 * Subscribe to new notifications.
 */
export function onNotificationCreated(callback: (data: NotificationItem) => void): () => void {
  socket?.on('notification.created', callback)
  return () => socket?.off('notification.created', callback)
}

/**
 * Subscribe to new emergency requests (for ambulance providers).
 */
export function onNewEmergency(callback: (data: { id: string; reference: string; location: string; emergencyType: string; destinationHospital: string }) => void): () => void {
  socket?.on('emergency.new', callback)
  return () => socket?.off('emergency.new', callback)
}

/**
 * Subscribe to new delivery requests (for pharmacy providers).
 */
export function onNewDelivery(callback: (data: { id: string; reference: string; medicineName: string; quantity: number; pharmacyId: string; deliveryAddress: string }) => void): () => void {
  socket?.on('delivery.new', callback)
  return () => socket?.off('delivery.new', callback)
}
