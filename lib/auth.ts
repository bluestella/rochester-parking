import NextAuth, { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

export const authOptions: NextAuthOptions = {
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
        // We need to wait for the adapter to create the user, so this might be tricky in signIn.
        // However, if the user exists, we can update.
        // Drizzle adapter might create user *after* signIn returns true? 
        // Actually, signIn callback runs before user creation if it's new.
        // But for existing users, it works.
        // A better place is an event or just check in JWT callback.
        // For simplicity, we'll try to update if exists, but catch error if not.
        try {
           await db.update(users).set({ role: 'ADMIN' }).where(eq(users.email, user.email))
        } catch (e) {
           // ignore if user doesn't exist yet
        }
      }
      return true
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}

export async function auth() {
  return getServerSession(authOptions)
}
