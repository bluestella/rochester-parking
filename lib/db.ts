import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema'

function getConnectionString() {
  return process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ''
}

let _db: any | undefined

function getDb() {
  if (_db) return _db
  const connectionString = getConnectionString()
  if (!connectionString) {
    throw new Error('Missing NETLIFY_DATABASE_URL or DATABASE_URL')
  }
  _db = drizzle(neon(connectionString), { schema })
  return _db
}

export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      return (getDb() as any)[prop]
    }
  }
) as any
