import type { Profession } from '../types'

export function roleLabelKey(role?: string): string {
  if (!role) return ''
  const map: Record<string, string> = {
    doctor: 'auth.docRole',
    nurse: 'auth.nurseRole',
    pharmacy: 'auth.pharmacyRole',
    laboratory: 'auth.labRole',
    imaging_center: 'auth.imagingRole',
    hospital: 'auth.hospitalRole',
    ambulance_driver: 'auth.ambulanceRole',
    psychologist: 'auth.psychologistRole',
    psychiatrist: 'auth.psychiatristRole',
    kinesitherapist: 'auth.kineRole',
    ergotherapist: 'auth.ergoRole',
    speech_therapist: 'auth.speechRole',
    dietitian: 'auth.dietitianRole',
    midwife: 'auth.midwifeRole',
    medical_ngo: 'auth.ngoRole',
    admin: 'admin.role',
  }
  return map[role] ?? role
}

/**
 * The allied-health professions, in the order they appear in the directory
 * filter. Mirrors the server's PRACTITIONER_ROLES.
 */
export const PROFESSIONS: Profession[] = [
  'psychologist',
  'psychiatrist',
  'kinesitherapist',
  'ergotherapist',
  'speech_therapist',
  'dietitian',
  'midwife',
]

/** Every role a healthcare professional can register under. */
export const PROVIDER_ROLES = [
  'doctor',
  'nurse',
  'pharmacy',
  'laboratory',
  'imaging_center',
  'hospital',
  'ambulance_driver',
  ...PROFESSIONS,
  'medical_ngo',
] as const

/**
 * Roles whose catalog record carries a `consultation_types` column, i.e. the
 * ones a patient can pick cabinet / home / hospital for. Doctors and the
 * allied-health professions; facilities and NGOs are not booked.
 */
export function supportsConsultationTypes(role?: string): boolean {
  return role === 'doctor' || (!!role && (PROFESSIONS as readonly string[]).includes(role))
}
