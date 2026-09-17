import type { Profile } from '@/types/profile'

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.errors?.join(', ') ?? `request failed with status ${response.status}`
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function fetchSavedUsers(): Promise<Profile[]> {
  const response = await fetch('/api/users')
  return handle<Profile[]>(response)
}

export async function saveUser(profile: Profile): Promise<Profile> {
  const { isSaved, ...body } = profile
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handle<Profile>(response)
}

export async function updateSavedUserName(
  uuid: string,
  name: { first: string; last: string },
): Promise<Profile> {
  const response = await fetch(`/api/users/${uuid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return handle<Profile>(response)
}

export async function deleteSavedUser(uuid: string): Promise<void> {
  const response = await fetch(`/api/users/${uuid}`, { method: 'DELETE' })
  return handle<void>(response)
}
