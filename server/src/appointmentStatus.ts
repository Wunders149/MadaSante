/**
 * Appointment status machine.
 *
 * Kept apart from the HTTP layer so it can be reasoned about — and tested —
 * without pulling in Express or a database pool. The rule that matters: a
 * patient may only withdraw their own booking.
 */

/** Statuses an appointment can hold. */
export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

/** A provider may confirm a request, complete a visit, or cancel. */
export const PROVIDER_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

/** A patient may only cancel. They can never confirm or complete their own visit. */
export const PATIENT_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ['cancelled'],
  confirmed: ['cancelled'],
  completed: [],
  cancelled: [],
}

/** Admins moderate any appointment, so they get the provider's transitions. */
export const ADMIN_TRANSITIONS = PROVIDER_TRANSITIONS

export function transitionsFor(role: string): Record<string, readonly string[]> {
  if (role === 'patient') return PATIENT_TRANSITIONS
  if (role === 'admin') return ADMIN_TRANSITIONS
  return PROVIDER_TRANSITIONS
}

/** True when `role` is allowed to move an appointment from `from` to `to`. */
export function canTransition(role: string, from: string, to: string): boolean {
  return (transitionsFor(role)[from] ?? []).includes(to)
}
