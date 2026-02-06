import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { users } from '../../../../db/schema'
import { desc } from 'drizzle-orm'
import { auth } from '../../../server-auth'
import { ensureCurrentUser } from '../../../../lib/user'

function forbidden() {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

export async function GET() {
  const session = await auth()
  const user = await ensureCurrentUser(session)
  if (!user || user.role !== 'ADMIN') return forbidden()
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    limit: 200
  })
  return NextResponse.json(allUsers)
}

export async function POST(req: Request) {
  const session = await auth()
  const user = await ensureCurrentUser(session)
  if (!user || user.role !== 'ADMIN') return forbidden()
  const body = await req.json()
  const [created] = await db.insert(users).values({
    email: body.email,
    name: body.name,
    role: body.role,
    buildingName: body.buildingName,
    unitNumber: body.unitNumber
  }).returning()
  return NextResponse.json(created, { status: 201 })
}
