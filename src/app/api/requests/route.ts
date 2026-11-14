import { ServiceRequest } from '@/models';
import { audit, like, nextNumber, ok, pageParams, paginated, parse, route } from '@/lib/api';
import { serviceRequestSchema } from '@/lib/validations';

// GET /api/requests — admin and maintenance staff see all tickets; everyone else sees the ones they filed
export const GET = route({}, async ({ request, userId, can }) => {
  const sp = request.nextUrl.searchParams;
  const { page, limit, skip } = pageParams(request, 50);
  const seeAll = can('requests:read_all');
  const query: Record<string, unknown> = seeAll ? {} : { requesterId: userId };

  const status = sp.get('status');
  if (status === 'active') query.status = { $in: ['open', 'in_progress', 'on_hold'] };
  else if (status) query.status = status;
  if (sp.get('category')) query.category = sp.get('category');
  const search = sp.get('search');
  if (search) query.$or = [{ title: like(search) }, { ticketNumber: like(search) }, { unitNumber: like(search) }];

  const [requests, total, counts] = await Promise.all([
    ServiceRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('requesterId', 'name')
      .lean(),
    ServiceRequest.countDocuments(query),
    seeAll
      ? ServiceRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      : [],
  ]);

  return ok({
    requests,
    counts: Object.fromEntries(counts.map((c: { _id: string; count: number }) => [c._id, c.count])),
    pagination: paginated(page, limit, total),
  });
});

// POST /api/requests — residents file for their unit; guards and admins report common-area issues
export const POST = route({}, async (ctx) => {
  const data = parse(serviceRequestSchema, await ctx.request.json());
  const { user } = ctx.session;
  const request = await ServiceRequest.create({
    ...data,
    // Residents cannot mark their own ticket urgent; the office sets that on triage.
    priority: ctx.role === 'resident' && data.priority === 'urgent' ? 'high' : data.priority,
    ticketNumber: await nextNumber('ticket', 'SR', 5),
    buildingName: user.buildingName,
    unitNumber: user.unitNumber,
    requesterId: ctx.userId,
    updates: [{ byName: user.name ?? 'Unknown', byRole: ctx.role, status: 'open', note: 'Request filed' }],
  });
  await audit(ctx, 'create', 'service_request', request._id, { ticket: request.ticketNumber });
  return ok(request, 201);
});
