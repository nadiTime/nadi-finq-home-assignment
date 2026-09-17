<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { XIcon } from '@lucide/vue'

defineProps<{ countries: string[] }>()

const ALL_COUNTRIES = '__all__'

const name = defineModel<string>('name', { required: true })
const country = defineModel<string>('country', { required: true })
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <div class="relative max-w-xs">
      <Input v-model="name" type="text" placeholder="Filter by name" class="pr-8" />
      <Button
        v-if="name"
        type="button"
        variant="ghost"
        size="icon-sm"
        class="absolute inset-y-0 right-0 my-auto"
        aria-label="Clear name filter"
        @click="name = ''"
      >
        <XIcon class="size-3.5" />
      </Button>
    </div>
    <div class="flex items-center gap-1">
      <Select
        :model-value="country === '' ? ALL_COUNTRIES : country"
        @update:model-value="(v) => (country = v === ALL_COUNTRIES ? '' : (v as string))"
      >
        <SelectTrigger class="w-48">
          <SelectValue placeholder="All countries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL_COUNTRIES">All countries</SelectItem>
          <SelectItem v-for="c in countries" :key="c" :value="c">{{ c }}</SelectItem>
        </SelectContent>
      </Select>
      <Button
        v-if="country"
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Clear country filter"
        @click="country = ''"
      >
        <XIcon class="size-3.5" />
      </Button>
    </div>
  </div>
</template>
