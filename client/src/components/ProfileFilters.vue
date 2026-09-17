<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

defineProps<{ countries: string[] }>()

const ALL_COUNTRIES = '__all__'

const name = defineModel<string>('name', { required: true })
const country = defineModel<string>('country', { required: true })
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <Input v-model="name" type="text" placeholder="Filter by name" class="max-w-xs" />
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
  </div>
</template>
