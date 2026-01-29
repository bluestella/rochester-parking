import NextAuth, { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
        const user = await prisma.user.findUnique({ where: { email: token.email } })
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
        await prisma.user.updateMany({ where: { email: user.email }, data: { role: 'ADMIN' } })
      }
      return true
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
export async function auth() {
  return getServerSession(authOptions)
}
