import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const dbPath = join(import.meta.dirname, '..', '..', 'data.sqlite')
const schemaPath = join(import.meta.dirname, 'schema.sql')

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.exec(readFileSync(schemaPath, 'utf-8'))
