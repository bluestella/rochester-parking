import { ServiceRequest } from '@/models';
import { HttpError, audit, ok, parse, route } from '@/lib/api';
import { serviceRequestUpdateSchema } from '@/lib/validations';

// GET /api/requests/[id]
export const GET = route({}, async ({ params, userId, can }) => {
  const request = await ServiceRequest.findById(params.id).populate('requesterId', 'name email').lean();
  if (!request || (!can('requests:read_all') && String(request.requesterId?._id) !== userId)) {
    throw new HttpError('Request not found', 404);
  }
  return ok(request);
});

// PATCH /api/requests/[id]
// Admin and maintenance staff triage (status, priority, assignee, note). The person who filed it
// can add a note, or close it once they are satisfied.
export const PATCH = route({}, async (ctx) => {
  const data = parse(serviceRequestUpdateSchema, await ctx.request.json());
  const request = await ServiceRequest.findById(ctx.params.id);
  const isRequester = request && String(request.requesterId) === ctx.userId;
  if (!request || (!ctx.can('requests:read_all') && !isRequester)) {
    throw new HttpError('Request not found', 404);
  }

  if (!ctx.can('requests:triage')) {
    if (data.priority || data.assignee !== undefined) throw new HttpError('Forbidden', 403);
    if (data.status && data.status !== 'closed') {
      throw new HttpError('You can close your request; the office sets other statuses');
    }
  }
  if (!data.note && !data.status && !data.priority && data.assignee === undefined) {
    throw new HttpError('Nothing to update');
  }

  const statusChanged = data.status && data.status !== request.status;
  if (statusChanged) {
    request.status = data.status!;
    request.resolvedAt = ['resolved', 'closed'].includes(data.status!) ? new Date() : undefined;
  }
  if (data.priority) request.priority = data.priority;
  if (data.assignee !== undefined) request.assignee = data.assignee;
  if (data.note || statusChanged) {
    request.updates.push({
      at: new Date(),
      byName: ctx.session.user.name ?? 'Unknown',
      byRole: ctx.role,
      note: data.note,
      status: statusChanged ? data.status : undefined,
    });
  }

  await request.save();
  await audit(ctx, 'update', 'service_request', request._id, {
    ticket: request.ticketNumber,
    status: request.status,
  });
  return ok(request);
});
