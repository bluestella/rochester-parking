import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import type { Session } from 'next-auth';
import type { ZodType } from 'zod';
import connectDB from './mongodb';
import { hasPermission, requireAuth, type Permission, type Role } from './rbac';
import { AuditLog, Counter } from '@/models';

export const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

/** Escape user input before it goes into a Mongo `$regex`. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function like(input: string) {
  return { $regex: escapeRegex(input.trim().slice(0, 100)), $options: 'i' };
}

export function isId(id: unknown): id is string {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

export function parse<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
    throw new HttpError(`${path}${issue.message}`, 400);
  }
  return result.data;
}

export function pageParams(request: NextRequest, defaultLimit = 20) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  const limit = Math.min(
    200,
    Math.max(1, parseInt(sp.get('limit') || String(defaultLimit), 10) || defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function paginated(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export interface RouteContext {
  request: NextRequest;
  session: Session;
  role: Role;
  userId: string;
  params: Record<string, string>;
}

interface RouteOptions {
  roles?: Role[];
  permission?: Permission;
}

/**
 * Wraps a route handler with authentication, authorisation, the database
 * connection and uniform error responses.
 */
export function route(
  options: RouteOptions,
  handler: (ctx: RouteContext) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    const { error, session } = await requireAuth();
    if (error) return error;
    const role = session!.user.role as Role;

    if (options.roles && !options.roles.includes(role)) return fail('Forbidden', 403);
    if (options.permission && !hasPermission(role, options.permission)) {
      return fail('Forbidden', 403);
    }

    try {
      await connectDB();
      const params = (await context?.params) ?? {};
      for (const [key, value] of Object.entries(params)) {
        if (key.toLowerCase().endsWith('id') && !isId(value)) {
          return fail('Invalid ID', 400);
        }
      }
      return await handler({
        request,
        session: session!,
        role,
        userId: session!.user.id,
        params,
      });
    } catch (err) {
      if (err instanceof HttpError) return fail(err.message, err.status);
      if ((err as { code?: number })?.code === 11000) {
        return fail('That record already exists', 409);
      }
      console.error(`${request.method} ${request.nextUrl.pathname} failed:`, err);
      return fail('Something went wrong on the server', 500);
    }
  };
}

export async function audit(
  ctx: RouteContext,
  action: string,
  resource: string,
  resourceId?: unknown,
  details?: Record<string, unknown>
) {
  await AuditLog.create({
    userId: ctx.userId,
    action,
    resource,
    resourceId: resourceId as mongoose.Types.ObjectId | undefined,
    details,
    ipAddress:
      ctx.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      ctx.request.headers.get('x-real-ip') ||
      undefined,
  });
}

/** Atomic, gap-tolerant sequence for document numbers. */
export async function nextNumber(key: string, prefix: string, width = 4) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return `${prefix}-${String(counter!.seq).padStart(width, '0')}`;
}

/** The units a signed-in user is tied to: owned, or matching their profile. */
export async function unitFilterFor(session: Session) {
  const or: Record<string, unknown>[] = [{ ownerId: session.user.id }];
  if (session.user.buildingName && session.user.unitNumber) {
    or.push({
      buildingName: session.user.buildingName,
      unitNumber: session.user.unitNumber,
    });
  }
  return { isActive: true, $or: or };
}
