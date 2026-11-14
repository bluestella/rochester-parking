import { z } from 'zod';
import { VisitorPass } from '@/models';
import { HttpError, audit, ok, parse, route } from '@/lib/api';

const schema = z.object({ action: z.enum(['arrive', 'depart', 'deny', 'cancel']) });

// Each action is only valid from one state; the filter enforces it atomically.
const transitions = {
  arrive: { from: 'expected', set: () => ({ status: 'arrived', arrivedAt: new Date() }) },
  depart: { from: 'arrived', set: () => ({ status: 'departed', departedAt: new Date() }) },
  deny: { from: 'expected', set: () => ({ status: 'denied' }) },
  cancel: { from: 'expected', set: () => ({ status: 'cancelled' }) },
} as const;

// PATCH /api/visitors/[id]
export const PATCH = route({}, async (ctx) => {
  const { action } = parse(schema, await ctx.request.json());
  const filter: Record<string, unknown> = { _id: ctx.params.id, status: transitions[action].from };

  if (ctx.role === 'resident') {
    if (action !== 'cancel') throw new HttpError('Forbidden', 403);
    filter.hostId = ctx.userId;
  }

  const pass = await VisitorPass.findOneAndUpdate(
    filter,
    { ...transitions[action].set(), ...(ctx.role !== 'resident' ? { handledBy: ctx.userId } : {}) },
    { returnDocument: 'after' }
  );
  if (!pass) throw new HttpError('This pass cannot be changed from its current status', 409);
  await audit(ctx, action, 'visitor_pass', pass._id, { visitor: pass.visitorName });
  return ok(pass);
});
