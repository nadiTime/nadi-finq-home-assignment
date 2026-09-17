import type { Profile } from '@/types/profile'

export function normalizeProfile(raw: unknown): Profile | null {
  const person = raw as Record<string, any>
  const uuid = person?.login?.uuid
  if (typeof uuid !== 'string' || uuid.length === 0) return null

  const dobDate = person.dob?.date ? new Date(person.dob.date) : null

  return {
    uuid,
    picture: {
      thumbnail: person.picture?.thumbnail ?? '',
      large: person.picture?.large ?? '',
    },
    name: {
      title: person.name?.title ?? '',
      first: person.name?.first ?? '',
      last: person.name?.last ?? '',
    },
    gender: person.gender ?? '',
    location: {
      country: person.location?.country ?? '',
      city: person.location?.city ?? '',
      state: person.location?.state ?? '',
      streetNumber: person.location?.street?.number ?? 0,
      streetName: person.location?.street?.name ?? '',
    },
    email: person.email ?? '',
    phone: person.phone ?? '',
    dob: {
      age: person.dob?.age ?? 0,
      year: dobDate && !Number.isNaN(dobDate.getTime()) ? dobDate.getFullYear() : 0,
    },
  }
}
