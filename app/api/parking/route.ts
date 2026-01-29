import { NextResponse } from 'next/server'
import { auth } from '../../server-auth'
import { prisma } from '../../../lib/prisma'
import { ensureCurrentUser } from '../../../lib/user'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await ensureCurrentUser(session)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const role = user.role
  if (role === 'RESIDENT') {
    const records = await prisma.parkingRecord.findMany({
      where: { residentId: user.id },
      orderBy: { entryTimestamp: 'desc' }
    })
    return NextResponse.json(records)
  }
  const records = await prisma.parkingRecord.findMany({
    orderBy: { entryTimestamp: 'desc' },
    take: 200
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
  let residentId: string | undefined = undefined
  if (residentEmail) {
    const resident = await prisma.user.findUnique({ where: { email: residentEmail } })
    if (resident) residentId = resident.id
  }
  const record = await prisma.parkingRecord.create({
    data: {
      plateNumber,
      buildingName,
      unitNumber,
      codename,
      residentId,
      createdById: user.id
    }
  })
  return NextResponse.json(record, { status: 201 })
}
