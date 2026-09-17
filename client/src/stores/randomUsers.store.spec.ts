import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRandomUsersStore } from './randomUsers.store'
import { useSavedUsersStore } from './savedUsers.store'

vi.mock('@/api/randomUsers', () => ({
  fetchRandomUsers: vi.fn(),
}))

import { fetchRandomUsers } from '@/api/randomUsers'

const rawPerson = (uuid: string, first: string) => ({
  login: { uuid },
  name: { title: 'Mr', first, last: 'Doe' },
  gender: 'male',
  location: { country: 'US', city: '', state: '', street: { number: 1, name: '' } },
  email: 'a@b.com',
  phone: '',
  picture: { thumbnail: '', large: '' },
  dob: { age: 30, date: '1994-01-01T00:00:00Z' },
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(fetchRandomUsers).mockReset()
})

describe('randomUsersStore', () => {
  it('markSaved flips isSaved locally without touching savedUsersStore', async () => {
    vi.mocked(fetchRandomUsers).mockResolvedValue([rawPerson('u1', 'Alice')])
    const store = useRandomUsersStore()
    const savedStore = useSavedUsersStore()

    await store.fetchOnce()
    store.markSaved('u1')

    expect(store.profiles[0]?.isSaved).toBe(true)
    expect(savedStore.profiles).toHaveLength(0)
  })

  it('updateLocalName mutates the matching profile in place', async () => {
    vi.mocked(fetchRandomUsers).mockResolvedValue([rawPerson('u1', 'Alice')])
    const store = useRandomUsersStore()

    await store.fetchOnce()
    store.updateLocalName('u1', { first: 'Bob', last: 'Smith' })

    expect(store.profiles[0]?.name.first).toBe('Bob')
    expect(store.profiles[0]?.name.last).toBe('Smith')
  })

  it('a second fetchOnce() call does not re-fetch', async () => {
    vi.mocked(fetchRandomUsers).mockResolvedValue([rawPerson('u1', 'Alice')])
    const store = useRandomUsersStore()

    await store.fetchOnce()
    await store.fetchOnce()

    expect(fetchRandomUsers).toHaveBeenCalledTimes(1)
  })
})
