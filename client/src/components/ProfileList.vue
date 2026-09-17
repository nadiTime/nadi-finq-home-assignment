<script setup lang="ts">
import ProfileFilters from '@/components/ProfileFilters.vue'
import ProfileRow from '@/components/ProfileRow.vue'
import { useProfileFilters } from '@/composables/useProfileFilters'
import type { Profile } from '@/types/profile'
import { toRef } from 'vue'

const props = defineProps<{ profiles: Profile[] }>()
defineEmits<{ select: [uuid: string] }>()

const { name, country, countries, filteredProfiles } = useProfileFilters(toRef(props, 'profiles'))
</script>

<template>
  <div class="flex flex-col gap-4">
    <ProfileFilters v-model:name="name" v-model:country="country" :countries="countries" />
    <div v-if="filteredProfiles.length === 0" class="text-sm text-muted-foreground">
      No profiles match the current filters.
    </div>
    <div v-else class="flex flex-col gap-2">
      <ProfileRow
        v-for="profile in filteredProfiles"
        :key="profile.uuid"
        :profile="profile"
        @click="$emit('select', profile.uuid)"
      />
    </div>
  </div>
</template>
