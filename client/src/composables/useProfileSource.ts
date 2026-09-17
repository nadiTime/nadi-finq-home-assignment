import { useRandomUsersStore } from '@/stores/randomUsers.store'
import { useSavedUsersStore } from '@/stores/savedUsers.store'
import type { Profile } from '@/types/profile'
import { computed, type ComputedRef } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export type ProfileSource = 'random' | 'saved'

export function useProfileSource(
  route: RouteLocationNormalizedLoaded,
): { profile: ComputedRef<Profile | undefined>; source: ComputedRef<ProfileSource | undefined> } {
  const randomUsersStore = useRandomUsersStore()
  const savedUsersStore = useSavedUsersStore()

  const source = computed<ProfileSource | undefined>(() => {
    const value = route.query.source
    return value === 'random' || value === 'saved' ? value : undefined
  })

  const profile = computed<Profile | undefined>(() => {
    const uuid = route.params.uuid as string
    const store = source.value === 'saved' ? savedUsersStore : randomUsersStore
    return store.profiles.find((p) => p.uuid === uuid)
  })

  return { profile, source }
}
