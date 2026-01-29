import { prisma } from './prisma'
import { Session } from 'next-auth'

export async function ensureCurrentUser(session: Session | null) {
  if (!session?.user?.email) return null
  const email = session.user.email
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: session.user.name || email,
      image: session.user.image || undefined
    }
  })
  return user
}
