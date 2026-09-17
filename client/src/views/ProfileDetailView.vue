<script setup lang="ts">
import { saveUser } from '@/api/savedUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfileSource } from '@/composables/useProfileSource'
import { useRandomUsersStore } from '@/stores/randomUsers.store'
import { useSavedUsersStore } from '@/stores/savedUsers.store'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const { profile, source } = useProfileSource(route)

const randomUsersStore = useRandomUsersStore()
const savedUsersStore = useSavedUsersStore()

const firstName = ref('')
const lastName = ref('')

watch(
  profile,
  (p) => {
    firstName.value = p?.name.first ?? ''
    lastName.value = p?.name.last ?? ''
  },
  { immediate: true },
)

const savePending = ref(false)
const updatePending = ref(false)
const deletePending = ref(false)

async function onSave() {
  if (!profile.value) return
  savePending.value = true
  try {
    await saveUser(profile.value)
    randomUsersStore.markSaved(profile.value.uuid)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to save profile')
  } finally {
    savePending.value = false
  }
}

async function onUpdate() {
  if (!profile.value) return
  updatePending.value = true
  const name = { first: firstName.value, last: lastName.value }
  try {
    if (source.value === 'saved') {
      await savedUsersStore.updateName(profile.value.uuid, name)
    } else {
      randomUsersStore.updateLocalName(profile.value.uuid, name)
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to update profile')
  } finally {
    updatePending.value = false
  }
}

async function onDelete() {
  if (!profile.value) return
  deletePending.value = true
  try {
    await savedUsersStore.remove(profile.value.uuid)
    randomUsersStore.clearSaved(profile.value.uuid)
    goBack()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to delete profile')
  } finally {
    deletePending.value = false
  }
}

function goBack() {
  router.push({ name: source.value === 'saved' ? 'saved-list' : 'random-list' })
}
</script>

<template>
  <div v-if="!profile" class="p-6 text-sm text-muted-foreground">Profile not found.</div>
  <div v-else class="flex flex-col gap-6 p-6">
    <Button variant="secondary" class="self-start" @click="goBack">Back</Button>

    <div class="mx-auto flex w-full max-w-md flex-col gap-6" dir="rtl">
      <img
        :src="profile.picture.large"
        alt=""
        class="mx-auto h-32 w-32 rounded-full object-cover"
      />

      <div class="flex items-center justify-between gap-3">
        <Label>מגדר</Label>
        <p>{{ profile.gender }}</p>
      </div>

      <div class="flex items-center justify-between gap-3">
        <Label>שם</Label>
        <div class="flex gap-2" dir="ltr">
          <Input v-model="firstName" dir="auto" class="text-left" placeholder="First" />
          <Input v-model="lastName" dir="auto" class="text-left" placeholder="Last" />
        </div>
      </div>

      <div class="flex items-center justify-between gap-3">
        <Label>גיל ושנת לידה</Label>
        <p>{{ profile.dob.age }} ({{ profile.dob.year }})</p>
      </div>

      <div class="flex items-center justify-between gap-3">
        <Label>כתובת</Label>
        <p class="text-right">
          <span dir="ltr" class="text-left">{{ profile.location.streetNumber }}</span>
          {{ profile.location.streetName }}, {{ profile.location.city }}, {{ profile.location.state }}
        </p>
      </div>

      <div class="flex items-center justify-between gap-3">
        <Label>אימייל</Label>
        <p dir="ltr" class="text-left">{{ profile.email }}</p>
      </div>

      <div class="flex items-center justify-between gap-3">
        <Label>טלפון</Label>
        <p dir="ltr" class="text-left">{{ profile.phone }}</p>
      </div>
    </div>

    <div class="mx-auto flex w-full max-w-md flex-col gap-2" dir="ltr">
      <Button v-if="source === 'random' && !profile.isSaved" :disabled="savePending" @click="onSave">
        {{ savePending ? 'Saving…' : 'Save' }}
      </Button>

      <Button :disabled="updatePending" variant="outline" @click="onUpdate">
        {{ updatePending ? 'Updating…' : 'Update' }}
      </Button>

      <Button v-if="source === 'saved'" :disabled="deletePending" variant="destructive" @click="onDelete">
        {{ deletePending ? 'Deleting…' : 'Delete' }}
      </Button>
    </div>
  </div>
</template>
