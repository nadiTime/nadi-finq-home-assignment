import type { Profile } from '@/types/profile'
import { computed, ref, type Ref } from 'vue'

export function useProfileFilters(profiles: Ref<Profile[]>) {
  const name = ref('')
  const country = ref('')

  const countries = computed(() => {
    const distinct = new Set(profiles.value.map((p) => p.location.country))
    return Array.from(distinct).sort()
  })

  const filteredProfiles = computed(() => {
    const nameQuery = name.value.trim().toLowerCase()
    return profiles.value.filter((p) => {
      const matchesName =
        nameQuery === '' || `${p.name.first} ${p.name.last}`.toLowerCase().includes(nameQuery)
      const matchesCountry = country.value === '' || p.location.country === country.value
      return matchesName && matchesCountry
    })
  })

  return { name, country, countries, filteredProfiles }
}
