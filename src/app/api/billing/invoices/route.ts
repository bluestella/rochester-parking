import { Invoice, Unit } from '@/models';
import {
  HttpError,
  audit,
  like,
  nextNumber,
  ok,
  pageParams,
  paginated,
  parse,
  route,
  unitFilterFor,
} from '@/lib/api';
import { invoiceView, sumItems } from '@/lib/billing';
import { createInvoiceSchema } from '@/lib/validations';

// GET /api/billing/invoices — admins see all statements; residents see their units'
export const GET = route({ permission: ['billing:read', 'billing:read_own'] }, async ({ request, session, can }) => {
  const sp = request.nextUrl.searchParams;
  const { page, limit, skip } = pageParams(request);
  const query: Record<string, unknown> = {};

  if (!can('billing:read')) {
    const units = await Unit.find(await unitFilterFor(session)).select('_id').lean();
    query.unitId = { $in: units.map((u) => u._id) };
    query.status = { $ne: 'void' };
  }

  const period = sp.get('period');
  const status = sp.get('status');
  const search = sp.get('search');
  if (period) query.period = period;
  if (status === 'paid' || status === 'void') query.status = status;
  if (status === 'open') query.status = 'open';
  if (status === 'overdue') Object.assign(query, { status: 'open', dueDate: { $lt: new Date() } });
  if (search && can('billing:read')) {
    query.$or = [{ unitNumber: like(search) }, { number: like(search) }, { buildingName: like(search) }];
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(query).sort({ period: -1, buildingName: 1, unitNumber: 1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(query),
  ]);

  return ok({
    invoices: invoices.map(invoiceView),
    pagination: paginated(page, limit, total),
  });
});

// POST /api/billing/invoices — one-off statement (repairs, move-in fees, etc.)
export const POST = route({ permission: 'billing:manage' }, async (ctx) => {
  const data = parse(createInvoiceSchema, await ctx.request.json());
  const unit = await Unit.findById(data.unitId);
  if (!unit) throw new HttpError('Unit not found', 404);
  const dueDate = new Date(data.dueDate);
  if (Number.isNaN(dueDate.getTime())) throw new HttpError('Due date is not a valid date');

  const invoice = await Invoice.create({
    number: await nextNumber(`invoice:${data.period}`, `SOA-${data.period.replace('-', '')}`),
    unitId: unit._id,
    buildingName: unit.buildingName,
    unitNumber: unit.unitNumber,
    period: data.period,
    items: data.items,
    total: sumItems(data.items),
    dueDate,
    createdBy: ctx.userId,
  });
  await audit(ctx, 'create', 'invoice', invoice._id, { number: invoice.number, total: invoice.total });
  return ok(invoiceView(invoice.toObject()), 201);
});
