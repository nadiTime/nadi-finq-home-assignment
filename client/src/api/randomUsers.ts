export async function fetchRandomUsers(): Promise<unknown[]> {
  const response = await fetch('https://randomuser.me/api/?results=10')
  if (!response.ok) {
    throw new Error(`randomuser.me request failed with status ${response.status}`)
  }
  const body = await response.json()
  return body.results as unknown[]
}
