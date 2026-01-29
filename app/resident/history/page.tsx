import { auth } from '../../server-auth'
import { prisma } from '../../../lib/prisma'

export default async function ResidentHistory() {
  const session = await auth()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { email: session.user?.email || '' } })
  if (!user) return null
  const records = await prisma.parkingRecord.findMany({
    where: { residentId: user.id },
    orderBy: { entryTimestamp: 'desc' }
  })
  return (
    <main style={{ padding: 24 }}>
      <h2>My Parking History</h2>
      <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
        {records.map(r => (
          <li key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <span>{r.plateNumber}</span>
            <span>{new Date(r.entryTimestamp).toLocaleString()}</span>
            <span>{r.exitTimestamp ? new Date(r.exitTimestamp).toLocaleString() : 'Active'}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
