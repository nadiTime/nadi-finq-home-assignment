import { describe, expect, it } from 'vitest'
import { normalizeProfile } from './normalizeProfile'

const validRaw = {
  login: { uuid: 'u1' },
  name: { title: 'Mr', first: 'Alice', last: 'Doe' },
  gender: 'female',
  location: { country: 'US', city: 'X', state: 'Y', street: { number: 12, name: 'Main St' } },
  email: 'a@b.com',
  phone: '555-0100',
  picture: { thumbnail: 'thumb.jpg', large: 'large.jpg' },
  dob: { age: 30, date: '1994-03-15T00:00:00Z' },
}

describe('normalizeProfile', () => {
  it('drops a record missing login.uuid', () => {
    const { login, ...rest } = validRaw
    expect(normalizeProfile(rest)).toBeNull()
    expect(normalizeProfile({ ...validRaw, login: { uuid: '' } })).toBeNull()
  })

  it('keeps a record with a valid uuid, defaulting a missing minor field', () => {
    const { location, ...rest } = validRaw
    const { state, ...locationWithoutState } = location
    const result = normalizeProfile({ ...rest, location: locationWithoutState })

    expect(result).not.toBeNull()
    expect(result?.uuid).toBe('u1')
    expect(result?.location.state).toBe('')
    expect(result?.location.country).toBe('US')
  })

  it('maps a fully-populated record into the flattened Profile shape', () => {
    const result = normalizeProfile(validRaw)

    expect(result).toEqual({
      uuid: 'u1',
      picture: { thumbnail: 'thumb.jpg', large: 'large.jpg' },
      name: { title: 'Mr', first: 'Alice', last: 'Doe' },
      gender: 'female',
      location: { country: 'US', city: 'X', state: 'Y', streetNumber: 12, streetName: 'Main St' },
      email: 'a@b.com',
      phone: '555-0100',
      dob: { age: 30, year: 1994 },
    })
  })
})
