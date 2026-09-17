import { deleteSavedUser, fetchSavedUsers, saveUser, updateSavedUserName } from '@/api/savedUsers'
import type { Profile } from '@/types/profile'
import { defineStore } from 'pinia'

export const useSavedUsersStore = defineStore('savedUsers', {
  state: () => ({
    profiles: [] as Profile[],
    status: 'idle' as 'idle' | 'loading' | 'error',
    error: null as string | null,
  }),
  actions: {
    async fetchAll() {
      this.status = 'loading'
      this.error = null
      try {
        this.profiles = await fetchSavedUsers()
        this.status = 'idle'
      } catch (err) {
        this.status = 'error'
        this.error = err instanceof Error ? err.message : 'Failed to fetch saved users'
      }
    },
    async save(profile: Profile) {
      const saved = await saveUser(profile)
      const existing = this.profiles.find((p) => p.uuid === saved.uuid)
      if (existing) {
        Object.assign(existing, saved)
      } else {
        this.profiles.push(saved)
      }
    },
    async updateName(uuid: string, name: { first: string; last: string }) {
      const updated = await updateSavedUserName(uuid, name)
      const existing = this.profiles.find((p) => p.uuid === uuid)
      if (existing) Object.assign(existing, updated)
    },
    async remove(uuid: string) {
      await deleteSavedUser(uuid)
      this.profiles = this.profiles.filter((p) => p.uuid !== uuid)
    },
  },
})
