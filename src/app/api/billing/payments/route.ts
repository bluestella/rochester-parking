import { Invoice, Payment, Unit } from '@/models';
import {
  HttpError,
  audit,
  nextNumber,
  ok,
  pageParams,
  paginated,
  parse,
  route,
  unitFilterFor,
} from '@/lib/api';
import { applyPayment } from '@/lib/billing';
import { round2 } from '@/lib/format';
import { paymentSchema } from '@/lib/validations';

// GET /api/billing/payments
export const GET = route({ permission: ['billing:read', 'billing:read_own'] }, async ({ request, session, can }) => {
  const { page, limit, skip } = pageParams(request);
  const query: Record<string, unknown> = {};
  const status = request.nextUrl.searchParams.get('status');
  if (status) query.status = status;
  if (!can('billing:read')) {
    const units = await Unit.find(await unitFilterFor(session)).select('_id').lean();
    query.unitId = { $in: units.map((u) => u._id) };
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('invoiceId', 'number period buildingName unitNumber total amountPaid status')
      .populate('submittedBy', 'name role')
      .lean(),
    Payment.countDocuments(query),
  ]);
  return ok({ payments, pagination: paginated(page, limit, total) });
});

// POST /api/billing/payments
// Billing staff record a payment and it is applied immediately with a receipt number.
// Residents report a payment they made; it waits for the office to confirm it.
export const POST = route({ permission: ['billing:manage', 'billing:read_own'] }, async (ctx) => {
  const data = parse(paymentSchema, await ctx.request.json());
  const amount = round2(data.amount);
  const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) throw new HttpError('Payment date is not a valid date');

  const invoice = await Invoice.findById(data.invoiceId);
  if (!invoice) throw new HttpError('Statement not found', 404);
  if (invoice.status !== 'open') throw new HttpError('This statement is not open for payment');

  const balance = round2(invoice.total - invoice.amountPaid);
  if (amount > balance) {
    throw new HttpError(`Amount is more than the balance of ${balance.toFixed(2)}`);
  }

  const base = {
    invoiceId: invoice._id,
    unitId: invoice.unitId,
    amount,
    method: data.method,
    reference: data.reference,
    note: data.note,
    paidAt,
    submittedBy: ctx.userId,
  };

  if (!ctx.can('billing:manage')) {
    const mine = await Unit.exists({ ...(await unitFilterFor(ctx.session)), _id: invoice.unitId });
    if (!mine) throw new HttpError('Statement not found', 404);
    const already = await Payment.exists({ invoiceId: invoice._id, status: 'pending' });
    if (already) {
      throw new HttpError('A payment for this statement is already waiting for confirmation');
    }
    const payment = await Payment.create({ ...base, status: 'pending' });
    await audit(ctx, 'report_payment', 'payment', payment._id, { invoice: invoice.number, amount });
    return ok(payment, 201);
  }

  await applyPayment(invoice._id, amount);
  const payment = await Payment.create({
    ...base,
    status: 'confirmed',
    receiptNumber: await nextNumber('receipt', 'OR', 6),
    reviewedBy: ctx.userId,
    reviewedAt: new Date(),
  });
  await audit(ctx, 'record_payment', 'payment', payment._id, {
    invoice: invoice.number,
    amount,
    receipt: payment.receiptNumber,
  });
  return ok(payment, 201);
});
