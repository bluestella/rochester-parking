import NextAuth from 'next-auth'
import { getAuthOptions } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: any) {
  const handler = NextAuth(getAuthOptions())
  return handler(req as any, ctx)
}

export async function POST(req: Request, ctx: any) {
  const handler = NextAuth(getAuthOptions())
  return handler(req as any, ctx)
}
