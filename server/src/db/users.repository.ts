import { db } from './connection.js'

export interface Profile {
  uuid: string
  picture: { thumbnail: string; large: string }
  name: { title: string; first: string; last: string }
  gender: string
  location: {
    country: string
    city: string
    state: string
    streetNumber: number
    streetName: string
  }
  email: string
  phone: string
  dob: { age: number; year: number }
}

const listStmt = db.prepare<[], { uuid: string; data: string }>('SELECT uuid, data FROM users')
const upsertStmt = db.prepare<{ uuid: string; data: string }>(
  'INSERT INTO users (uuid, data) VALUES (:uuid, :data) ON CONFLICT(uuid) DO UPDATE SET data = :data',
)
const getStmt = db.prepare<[string], { uuid: string; data: string }>(
  'SELECT uuid, data FROM users WHERE uuid = ?',
)
const deleteStmt = db.prepare<[string]>('DELETE FROM users WHERE uuid = ?')

function parseRow(row: { uuid: string; data: string }): Profile {
  return JSON.parse(row.data) as Profile
}

export function listUsers(): Profile[] {
  return listStmt.all().map(parseRow)
}

export function upsertUser(profile: Profile): void {
  upsertStmt.run({ uuid: profile.uuid, data: JSON.stringify(profile) })
}

export function updateUserName(uuid: string, name: { first: string; last: string }): Profile | null {
  const row = getStmt.get(uuid)
  if (!row) return null
  const profile = parseRow(row)
  profile.name.first = name.first
  profile.name.last = name.last
  upsertUser(profile)
  return profile
}

export function deleteUser(uuid: string): boolean {
  const result = deleteStmt.run(uuid)
  return result.changes > 0
}
