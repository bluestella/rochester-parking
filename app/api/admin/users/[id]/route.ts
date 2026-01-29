import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { auth } from '../../../../server-auth'
import { ensureCurrentUser } from '../../../../../lib/user'

function forbidden() {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const admin = await ensureCurrentUser(session)
  if (!admin || admin.role !== 'ADMIN') return forbidden()
  const body = await req.json()
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      email: body.email,
      name: body.name,
      role: body.role,
      buildingName: body.buildingName,
      unitNumber: body.unitNumber
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const admin = await ensureCurrentUser(session)
  if (!admin || admin.role !== 'ADMIN') return forbidden()
  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
