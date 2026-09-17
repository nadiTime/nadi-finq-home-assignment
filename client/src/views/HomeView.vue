<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <Button size="lg" @click="router.push({ name: 'random-list' })">Fetch</Button>
    <Button size="lg" variant="secondary" @click="router.push({ name: 'saved-list' })">
      History
    </Button>
  </div>
</template>
