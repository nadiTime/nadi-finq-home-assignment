<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ProfileList from '@/components/ProfileList.vue'
import { useSavedUsersStore } from '@/stores/savedUsers.store'
import { TriangleAlertIcon } from '@lucide/vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const store = useSavedUsersStore()
const router = useRouter()

onMounted(() => {
  store.fetchAll()
})

function goToProfile(uuid: string) {
  router.push({ name: 'profile-detail', params: { uuid }, query: { source: 'saved' } })
}
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <Button variant="secondary" class="self-start" @click="router.push({ name: 'home' })">
      Back
    </Button>

    <div v-if="store.status === 'loading'" class="text-sm text-muted-foreground">Loading...</div>
    <div v-else-if="store.status === 'error'" class="flex flex-col gap-2">
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Couldn't load saved profiles</AlertTitle>
        <AlertDescription>{{ store.error }}</AlertDescription>
      </Alert>
      <Button variant="outline" class="self-start" @click="store.fetchAll()">Retry</Button>
    </div>
    <div v-else-if="store.profiles.length === 0" class="text-sm text-muted-foreground">
      No saved profiles yet.
    </div>
    <ProfileList v-else :profiles="store.profiles" @select="goToProfile" />
  </div>
</template>
