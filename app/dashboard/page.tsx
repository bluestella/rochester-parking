import Link from 'next/link'
import { auth } from '../server-auth'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await auth()
  if (!session) {
    return (
      <main style={{ padding: 24 }}>
        <h2>Not signed in</h2>
        <Link href="/api/auth/signin">Sign in</Link>
      </main>
    )
  }
  const role = (session.user as any)?.role || 'RESIDENT'
  return (
    <main style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      {role === 'ADMIN' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/admin/users">Manage Users</Link>
          <Link href="/parking">Parking Records</Link>
        </div>
      )}
      {role === 'GUARD' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/parking/new">Add Parking Entry</Link>
          <Link href="/parking">Manage Active Parking</Link>
        </div>
      )}
      {role === 'RESIDENT' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/resident/history">My Parking History</Link>
        </div>
      )}
    </main>
  )
}
