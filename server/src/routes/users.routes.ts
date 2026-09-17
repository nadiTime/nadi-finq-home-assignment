import { Router } from 'express'
import { deleteUser, listUsers, updateUserName, upsertUser } from '../db/users.repository.js'
import { validateCreateUser, validateUpdateName } from '../validation/users.schema.js'

export const usersRouter = Router()

usersRouter.get('/', (_req, res) => {
  res.status(200).json(listUsers())
})

usersRouter.post('/', (req, res) => {
  const result = validateCreateUser(req.body)
  if (!result.ok) {
    res.status(400).json({ errors: result.errors })
    return
  }
  upsertUser(result.data)
  res.status(201).json(result.data)
})

usersRouter.patch('/:uuid', (req, res) => {
  const result = validateUpdateName(req.body)
  if (!result.ok) {
    res.status(400).json({ errors: result.errors })
    return
  }
  const updated = updateUserName(req.params.uuid, result.data.name)
  if (!updated) {
    res.status(404).json({ errors: ['user not found'] })
    return
  }
  res.status(200).json(updated)
})

usersRouter.delete('/:uuid', (req, res) => {
  const deleted = deleteUser(req.params.uuid)
  if (!deleted) {
    res.status(404).json({ errors: ['user not found'] })
    return
  }
  res.status(204).end()
})
