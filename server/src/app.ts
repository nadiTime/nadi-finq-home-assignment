import express from 'express'
import { usersRouter } from './routes/users.routes.js'

export const app = express()

app.use(express.json())
app.use('/api/users', usersRouter)
