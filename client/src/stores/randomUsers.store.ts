import { fetchRandomUsers } from '@/api/randomUsers'
import { normalizeProfile } from '@/lib/normalizeProfile'
import type { Profile } from '@/types/profile'
import { defineStore } from 'pinia'

export const useRandomUsersStore = defineStore('randomUsers', {
  state: () => ({
    profiles: [] as Profile[],
    status: 'idle' as 'idle' | 'loading' | 'error',
    error: null as string | null,
    fetchedOnce: false,
  }),
  actions: {
    async fetchOnce() {
      if (this.fetchedOnce) return
      this.status = 'loading'
      this.error = null
      try {
        const raw = await fetchRandomUsers()
        this.profiles = raw.map(normalizeProfile).filter((p): p is Profile => p !== null)
        this.fetchedOnce = true
        this.status = 'idle'
      } catch (err) {
        this.status = 'error'
        this.error = err instanceof Error ? err.message : 'Failed to fetch random users'
      }
    },
    markSaved(uuid: string) {
      const profile = this.profiles.find((p) => p.uuid === uuid)
      if (profile) profile.isSaved = true
    },
    clearSaved(uuid: string) {
      const profile = this.profiles.find((p) => p.uuid === uuid)
      if (profile) profile.isSaved = false
    },
    updateLocalName(uuid: string, name: { first: string; last: string }) {
      const profile = this.profiles.find((p) => p.uuid === uuid)
      if (profile) {
        profile.name.first = name.first
        profile.name.last = name.last
      }
    },
  },
})
