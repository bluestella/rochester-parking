import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { auth } from '../../../server-auth'
import { ensureCurrentUser } from '../../../../lib/user'

function forbidden() {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

export async function GET() {
  const session = await auth()
  const user = await ensureCurrentUser(session)
  if (!user || user.role !== 'ADMIN') return forbidden()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await auth()
  const user = await ensureCurrentUser(session)
  if (!user || user.role !== 'ADMIN') return forbidden()
  const body = await req.json()
  const created = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      role: body.role,
      buildingName: body.buildingName,
      unitNumber: body.unitNumber
    }
  })
  return NextResponse.json(created, { status: 201 })
}
