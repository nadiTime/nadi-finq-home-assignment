import { RANDOM_USER_API_URL, RANDOM_USER_RESULTS_COUNT } from './constants'

export async function fetchRandomUsers(): Promise<unknown[]> {
  const response = await fetch(`${RANDOM_USER_API_URL}?results=${RANDOM_USER_RESULTS_COUNT}`)
  if (!response.ok) {
    throw new Error(`randomuser.me request failed with status ${response.status}`)
  }
  const body = await response.json()
  return body.results as unknown[]
}
