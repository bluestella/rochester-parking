import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema'
import { getEnv } from './env'

function getConnectionString() {
  return getEnv('NETLIFY_DATABASE_URL') || getEnv('DATABASE_URL') || ''
}

let _db: any | undefined

function getDb() {
  if (_db) return _db
  const connectionString = getConnectionString()
  if (!connectionString) {
    throw new Error('Missing NETLIFY_DATABASE_URL or DATABASE_URL')
  }
  try {
    new URL(connectionString)
  } catch {
    throw new Error('Invalid NETLIFY_DATABASE_URL or DATABASE_URL')
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
