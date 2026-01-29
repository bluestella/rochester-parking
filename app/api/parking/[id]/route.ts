import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { auth } from '../../../server-auth'
import { ensureCurrentUser } from '../../../../lib/user'

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await ensureCurrentUser(session)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (user.role === 'RESIDENT') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const record = await prisma.parkingRecord.update({
    where: { id: params.id },
    data: { status: 'EXITED', exitTimestamp: new Date() }
  })
  return NextResponse.json(record)
}
