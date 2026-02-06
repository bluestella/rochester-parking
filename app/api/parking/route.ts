import { NextResponse } from 'next/server'
import { auth } from '../../server-auth'
import { db } from '../../../lib/db'
import { parkingRecords, users } from '../../../db/schema'
import { desc, eq } from 'drizzle-orm'
import { ensureCurrentUser } from '../../../lib/user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await ensureCurrentUser(session)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const role = user.role
  if (role === 'RESIDENT') {
    const records = await db.query.parkingRecords.findMany({
      where: eq(parkingRecords.residentId, user.id),
      orderBy: [desc(parkingRecords.entryTimestamp)]
    })
    return NextResponse.json(records)
  }
  const records = await db.query.parkingRecords.findMany({
    orderBy: [desc(parkingRecords.entryTimestamp)],
    limit: 200
  })
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await ensureCurrentUser(session)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (user.role === 'RESIDENT') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json()
  const { plateNumber, buildingName, unitNumber, codename, residentEmail } = body
  let residentId: string | undefined | null = undefined
  if (residentEmail) {
    const resident = await db.query.users.findFirst({ where: eq(users.email, residentEmail) })
    if (resident) residentId = resident.id
  }
  const [record] = await db.insert(parkingRecords).values({
    plateNumber,
    buildingName,
    unitNumber,
    codename,
    residentId: residentId || null,
    createdById: user.id
  } as any).returning()
  return NextResponse.json(record, { status: 201 })
}
