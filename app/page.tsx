import Link from 'next/link'
import { auth } from './server-auth'

export default async function Home() {
  const session = await auth()
  return (
    <main style={{ padding: 24 }}>
      <h1>Condo Parking</h1>
      {!session && (
        <div>
          <Link href="/api/auth/signin">Sign in with Google</Link>
        </div>
      )}
      {session && (
        <div>
          <p>Signed in as {session.user?.email}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/dashboard">Go to Dashboard</Link>
            <Link href="/api/auth/signout">Sign out</Link>
          </div>
        </div>
      )}
    </main>
  )
}
