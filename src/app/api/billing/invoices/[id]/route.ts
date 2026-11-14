import { z } from 'zod';
import { Invoice, Payment, Unit } from '@/models';
import { HttpError, audit, ok, parse, route, unitFilterFor } from '@/lib/api';
import { invoiceView } from '@/lib/billing';
import { invoiceItemSchema } from '@/lib/validations';

// GET /api/billing/invoices/[id] — statement with its payment history
export const GET = route({ roles: ['admin', 'resident'] }, async ({ params, session, role }) => {
  const invoice = await Invoice.findById(params.id).lean();
  if (!invoice) throw new HttpError('Statement not found', 404);
  if (role === 'resident') {
    const mine = await Unit.exists({ ...(await unitFilterFor(session)), _id: invoice.unitId });
    if (!mine) throw new HttpError('Statement not found', 404);
  }
  const payments = await Payment.find({ invoiceId: invoice._id })
    .sort({ paidAt: -1 })
    .populate('submittedBy', 'name')
    .lean();
  return ok({ ...invoiceView(invoice), payments });
});

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('void') }),
  z.object({ action: z.literal('add_charge'), item: invoiceItemSchema }),
]);

// PATCH /api/billing/invoices/[id] — void, or add a charge to an open statement
export const PATCH = route({ roles: ['admin'] }, async (ctx) => {
  const body = parse(actionSchema, await ctx.request.json());

  if (body.action === 'void') {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: ctx.params.id, status: 'open', amountPaid: 0 },
      { $set: { status: 'void' }, $unset: { runKey: 1 } },
      { returnDocument: 'after' }
    );
    if (!invoice) {
      throw new HttpError('Only open statements with no payments can be voided');
    }
    await Payment.updateMany(
      { invoiceId: invoice._id, status: 'pending' },
      { status: 'rejected', note: 'Statement was voided' }
    );
    await audit(ctx, 'void', 'invoice', invoice._id, { number: invoice.number });
    return ok(invoiceView(invoice.toObject()));
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: ctx.params.id, status: 'open' },
    [
      { $set: { items: { $concatArrays: ['$items', [body.item]] } } },
      { $set: { total: { $round: [{ $add: ['$total', body.item.amount] }, 2] } } },
    ],
    { returnDocument: 'after', updatePipeline: true }
  );
  if (!invoice) throw new HttpError('Charges can only be added to an open statement');
  await audit(ctx, 'add_charge', 'invoice', invoice._id, { number: invoice.number, ...body.item });
  return ok(invoiceView(invoice.toObject()));
});
