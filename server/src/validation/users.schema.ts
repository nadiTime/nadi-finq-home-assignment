import type { Profile } from '../db/users.repository.js'

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: string[] }

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

export function validateCreateUser(body: unknown): ValidationResult<Profile> {
  const errors: string[] = []

  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: ['body must be an object'] }
  }

  const candidate = body as Record<string, unknown>

  if (!isNonEmptyString(candidate.uuid)) {
    errors.push('uuid is required and must be a non-empty string')
  }

  const name = candidate.name as Record<string, unknown> | undefined
  if (typeof name !== 'object' || name === null) {
    errors.push('name is required and must be an object')
  } else {
    if (!isNonEmptyString(name.first)) errors.push('name.first is required and must be a non-empty string')
    if (!isNonEmptyString(name.last)) errors.push('name.last is required and must be a non-empty string')
  }

  if (errors.length > 0) return { ok: false, errors }

  return { ok: true, data: candidate as unknown as Profile }
}

export interface UpdateNameBody {
  name: { first: string; last: string }
}

export function validateUpdateName(body: unknown): ValidationResult<UpdateNameBody> {
  const errors: string[] = []

  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: ['body must be an object'] }
  }

  const candidate = body as Record<string, unknown>
  const name = candidate.name as Record<string, unknown> | undefined

  if (typeof name !== 'object' || name === null) {
    errors.push('name is required and must be an object')
  } else {
    if (!isNonEmptyString(name.first)) errors.push('name.first is required and must be a non-empty string')
    if (!isNonEmptyString(name.last)) errors.push('name.last is required and must be a non-empty string')
  }

  if (errors.length > 0) return { ok: false, errors }

  return { ok: true, data: { name: { first: name!.first as string, last: name!.last as string } } }
}
