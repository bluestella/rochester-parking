import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, user, profile }) {
      if (account) {
        const admins = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim()).filter(Boolean)
        const email = (user as any)?.email || (profile as any)?.email || token.email
        token.role = admins.includes(email || '') ? 'ADMIN' : 'RESIDENT'
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        role: (token as any).role
      } as any
      return session
    }
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET
})
