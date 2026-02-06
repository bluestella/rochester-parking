import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { parkingRecords } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '../../../server-auth'
import { ensureCurrentUser } from '../../../../lib/user'

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await ensureCurrentUser(session)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (user.role === 'RESIDENT') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const [record] = await db.update(parkingRecords).set({
    status: 'EXITED',
    exitTimestamp: new Date()
  }).where(eq(parkingRecords.id, params.id)).returning()
  return NextResponse.json(record)
}
