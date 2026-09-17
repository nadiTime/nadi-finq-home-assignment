import { z } from 'zod'
import type { Profile } from '../db/users.repository.js'

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: string[] }

const nameSchema = z.object({
  first: z.string().min(1, 'name.first is required and must be a non-empty string'),
  last: z.string().min(1, 'name.last is required and must be a non-empty string'),
})

// `z.ZodType<Profile>` cross-checks this schema's output against `Profile` at compile time,
// so there's no cast between the parsed value and the repository type.
const profileSchema: z.ZodType<Profile> = z.object({
  uuid: z.string().min(1, 'uuid is required and must be a non-empty string'),
  picture: z.object({
    thumbnail: z.string(),
    large: z.string(),
  }),
  name: z.object({
    title: z.string(),
    first: nameSchema.shape.first,
    last: nameSchema.shape.last,
  }),
  gender: z.string(),
  location: z.object({
    country: z.string(),
    city: z.string(),
    state: z.string(),
    streetNumber: z.number(),
    streetName: z.string(),
  }),
  email: z.string(),
  phone: z.string(),
  dob: z.object({
    age: z.number(),
    year: z.number(),
  }),
})

export interface NameInput {
  first: string
  last: string
}

export interface UpdateNameBody {
  name: NameInput
}

const updateNameSchema: z.ZodType<UpdateNameBody> = z.object({
  name: nameSchema,
})

function toValidationResult<T>(result: z.ZodSafeParseResult<T>): ValidationResult<T> {
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, errors: result.error.issues.map((issue: z.core.$ZodIssue) => issue.message) }
}

export function validateCreateUser(body: unknown): ValidationResult<Profile> {
  return toValidationResult(profileSchema.safeParse(body))
}

export function validateUpdateName(body: unknown): ValidationResult<UpdateNameBody> {
  return toValidationResult(updateNameSchema.safeParse(body))
}
