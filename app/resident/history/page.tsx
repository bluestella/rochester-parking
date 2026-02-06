import { auth } from '../../server-auth'
import { db } from '../../../lib/db'
import { users, parkingRecords } from '../../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default async function ResidentHistory() {
  const session = await auth()
  if (!session) return null
  const user = await db.query.users.findFirst({ where: eq(users.email, session.user?.email || '') })
  if (!user) return null
  const records = await db.query.parkingRecords.findMany({
    where: eq(parkingRecords.residentId, user.id),
    orderBy: [desc(parkingRecords.entryTimestamp)]
  })
  return (
    <main style={{ padding: 24 }}>
      <h2>My Parking History</h2>
      <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
        {records.map(r => (
          <li key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <span>{r.plateNumber}</span>
            <span>{r.entryTimestamp?.toLocaleString()}</span>
            <span>{r.exitTimestamp ? r.exitTimestamp.toLocaleString() : 'Active'}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
