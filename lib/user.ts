import { db } from './db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { Session } from 'next-auth'

export async function ensureCurrentUser(session: Session | null) {
  if (!session?.user?.email) return null
  const email = session.user.email
  
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email)
  })

  if (existing) return existing

  // create if not exists
  const [created] = await db.insert(users).values({
    email,
    name: session.user.name || email,
    image: session.user.image || undefined
  } as any).returning()
  
  return created
}
