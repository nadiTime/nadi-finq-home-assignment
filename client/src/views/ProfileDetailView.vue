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
const saveError = ref<string | null>(null)
const updatePending = ref(false)
const updateError = ref<string | null>(null)
const deletePending = ref(false)
const deleteError = ref<string | null>(null)

async function onSave() {
  if (!profile.value) return
  savePending.value = true
  saveError.value = null
  try {
    await saveUser(profile.value)
    randomUsersStore.markSaved(profile.value.uuid)
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to save profile'
  } finally {
    savePending.value = false
  }
}

async function onUpdate() {
  if (!profile.value) return
  updatePending.value = true
  updateError.value = null
  const name = { first: firstName.value, last: lastName.value }
  try {
    if (source.value === 'saved') {
      await savedUsersStore.updateName(profile.value.uuid, name)
    } else {
      randomUsersStore.updateLocalName(profile.value.uuid, name)
    }
  } catch (err) {
    updateError.value = err instanceof Error ? err.message : 'Failed to update profile'
  } finally {
    updatePending.value = false
  }
}

async function onDelete() {
  if (!profile.value) return
  deletePending.value = true
  deleteError.value = null
  try {
    await savedUsersStore.remove(profile.value.uuid)
    goBack()
  } catch (err) {
    deletePending.value = false
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete profile'
  }
}

function goBack() {
  router.push({ name: source.value === 'saved' ? 'saved-list' : 'random-list' })
}
</script>

<template>
  <div v-if="!profile" class="p-6 text-sm text-muted-foreground">Profile not found.</div>
  <div v-else class="mx-auto flex max-w-md flex-col gap-6 p-6" dir="rtl">
    <img
      :src="profile.picture.large"
      alt=""
      class="mx-auto h-32 w-32 rounded-full object-cover"
    />

    <div class="flex flex-col gap-1">
      <Label>מגדר</Label>
      <p>{{ profile.gender }}</p>
    </div>

    <div class="flex flex-col gap-1">
      <Label>שם</Label>
      <div class="flex gap-2" dir="ltr">
        <Input v-model="firstName" class="text-left" style="direction: ltr" placeholder="First" />
        <Input v-model="lastName" class="text-left" style="direction: ltr" placeholder="Last" />
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <Label>גיל ושנת לידה</Label>
      <p>{{ profile.dob.age }} ({{ profile.dob.year }})</p>
    </div>

    <div class="flex flex-col gap-1">
      <Label>כתובת</Label>
      <p>
        <span dir="ltr" class="text-left">{{ profile.location.streetNumber }}</span>
        {{ profile.location.streetName }}, {{ profile.location.city }}, {{ profile.location.state }}
      </p>
    </div>

    <div class="flex flex-col gap-1">
      <Label>אימייל</Label>
      <p dir="ltr" class="text-left">{{ profile.email }}</p>
    </div>

    <div class="flex flex-col gap-1">
      <Label>טלפון</Label>
      <p dir="ltr" class="text-left">{{ profile.phone }}</p>
    </div>

    <div class="flex flex-col gap-2" dir="ltr">
      <div v-if="source === 'random' && !profile.isSaved" class="flex flex-col gap-1">
        <Button :disabled="savePending" @click="onSave">{{ savePending ? 'Saving…' : 'Save' }}</Button>
        <p v-if="saveError" class="text-sm text-destructive">{{ saveError }}</p>
      </div>

      <div class="flex flex-col gap-1">
        <Button :disabled="updatePending" variant="outline" @click="onUpdate">
          {{ updatePending ? 'Updating…' : 'Update' }}
        </Button>
        <p v-if="updateError" class="text-sm text-destructive">{{ updateError }}</p>
      </div>

      <div v-if="source === 'saved'" class="flex flex-col gap-1">
        <Button :disabled="deletePending" variant="destructive" @click="onDelete">
          {{ deletePending ? 'Deleting…' : 'Delete' }}
        </Button>
        <p v-if="deleteError" class="text-sm text-destructive">{{ deleteError }}</p>
      </div>

      <Button variant="secondary" @click="goBack">Back</Button>
    </div>
  </div>
</template>
