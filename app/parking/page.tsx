import { auth } from '../server-auth'
import { db } from '../../lib/db'
import { parkingRecords } from '../../db/schema'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export default async function ParkingList() {
  const session = await auth()
  if (!session) return null
  const records = await db.query.parkingRecords.findMany({
    where: eq(parkingRecords.status, 'ACTIVE'),
    orderBy: [desc(parkingRecords.entryTimestamp)],
    limit: 200
  })
  async function exit(id: string) {
    'use server'
    await db.update(parkingRecords)
      .set({ status: 'EXITED', exitTimestamp: new Date() })
      .where(eq(parkingRecords.id, id))
    revalidatePath('/parking')
  }
  return (
    <main style={{ padding: 24 }}>
      <h2>Active Parking</h2>
      <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
        {records.map(r => (
          <li key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{r.plateNumber}</span>
            <span>{r.buildingName} {r.unitNumber}</span>
            <span>{r.entryTimestamp?.toLocaleString()}</span>
            <form action={exit.bind(null, r.id)}>
              <button type="submit">Mark Exit</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  )
}
