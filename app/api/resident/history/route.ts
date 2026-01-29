import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { auth } from '../../../server-auth'
import { ensureCurrentUser } from '../../../../lib/user'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await ensureCurrentUser(session)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const records = await prisma.parkingRecord.findMany({
    where: { residentId: user.id },
    orderBy: { entryTimestamp: 'desc' }
  })
  return NextResponse.json(records)
}
