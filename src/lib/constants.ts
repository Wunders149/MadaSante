export const CITIES = [
  'Antananarivo',
  'Mahajanga',
  'Toamasina',
  'Fianarantsoa',
  'Toliara',
  'Antsiranana',
]

const dateOffset = (day: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + day)
  return d.toISOString().slice(0, 10)
}

export const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']

export const nextDays = [dateOffset(0), dateOffset(1), dateOffset(2), dateOffset(3), dateOffset(4), dateOffset(5), dateOffset(6)]