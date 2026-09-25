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
    admin: 'admin.role',
  }
  return map[role] ?? role
}