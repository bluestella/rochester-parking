import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

export function getAuthOptions(): NextAuthOptions {
  return {
    adapter: DrizzleAdapter(db),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
      })
    ],
    session: { strategy: 'jwt' },
    callbacks: {
      async jwt({ token }) {
        if (token.email) {
          const user = await db.query.users.findFirst({
            where: eq(users.email, token.email)
          })
          if (user) token.role = user.role
        }
        return token
      },
      async session({ session, token }) {
        session.user = {
          ...session.user,
          role: (token as any).role
        } as any
        return session
      },
      async signIn({ user }) {
        const admins = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim()).filter(Boolean)
        if (user?.email && admins.includes(user.email)) {
          try {
            await db.update(users).set({ role: 'ADMIN' } as any).where(eq(users.email, user.email))
          } catch (e) {
          }
        }
        return true
      }
    },
    secret: process.env.NEXTAUTH_SECRET
  }
}

export async function auth() {
  return getServerSession(getAuthOptions())
}
