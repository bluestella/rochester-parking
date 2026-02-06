import { NextResponse } from 'next/server'
import { db } from '../../../../../lib/db'
import { users } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '../../../../server-auth'
import { ensureCurrentUser } from '../../../../../lib/user'

export const dynamic = 'force-dynamic'

function forbidden() {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const admin = await ensureCurrentUser(session)
  if (!admin || admin.role !== 'ADMIN') return forbidden()
  const body = await req.json()
  const [updated] = await db.update(users).set({
    email: body.email,
    name: body.name,
    role: body.role,
    buildingName: body.buildingName,
    unitNumber: body.unitNumber
  } as any).where(eq(users.id, params.id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const admin = await ensureCurrentUser(session)
  if (!admin || admin.role !== 'ADMIN') return forbidden()
  await db.delete(users).where(eq(users.id, params.id))
  return NextResponse.json({ ok: true })
}
