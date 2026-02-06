import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { parkingRecords } from '../../../../db/schema'
import { desc, eq } from 'drizzle-orm'
import { auth } from '../../../server-auth'
import { ensureCurrentUser } from '../../../../lib/user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await ensureCurrentUser(session)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const records = await db.query.parkingRecords.findMany({
    where: eq(parkingRecords.residentId, user.id),
    orderBy: [desc(parkingRecords.entryTimestamp)]
  })
  return NextResponse.json(records)
}
