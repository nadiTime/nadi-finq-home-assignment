<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import type { Profile } from '@/types/profile'

defineProps<{ profile: Profile }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <Card
    class="cursor-pointer transition-colors hover:bg-accent/50"
    @click="$emit('click')"
  >
    <CardContent class="flex items-center gap-4">
      <img
        :src="profile.picture.thumbnail"
        alt=""
        class="h-12 w-12 shrink-0 rounded-full object-cover"
      />
      <div class="flex flex-1 flex-col gap-0.5">
        <div class="flex items-center gap-2 font-medium">
          <span>{{ profile.name.title }} {{ profile.name.first }} {{ profile.name.last }}</span>
          <span
            v-if="profile.isSaved"
            class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
          >
            Saved
          </span>
        </div>
        <div class="text-sm text-muted-foreground">
          {{ profile.gender }} · {{ profile.location.country }}
        </div>
        <div class="text-sm text-muted-foreground" dir="ltr">
          {{ profile.phone }} · {{ profile.email }}
        </div>
      </div>
    </CardContent>
  </Card>
</template>
