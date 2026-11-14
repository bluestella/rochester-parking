import { z } from 'zod';
import { Payment } from '@/models';
import { HttpError, audit, nextNumber, ok, parse, route } from '@/lib/api';
import { applyPayment } from '@/lib/billing';

const schema = z.object({
  action: z.enum(['confirm', 'reject']),
  note: z.string().trim().max(500).optional(),
});

// PATCH /api/billing/payments/[id] — confirm or reject a payment a resident reported
export const PATCH = route({ permission: 'billing:manage' }, async (ctx) => {
  const { action, note } = parse(schema, await ctx.request.json());
  const review = { reviewedBy: ctx.userId, reviewedAt: new Date(), ...(note ? { note } : {}) };

  // Claim the pending payment first so it cannot be confirmed twice.
  const payment = await Payment.findOneAndUpdate(
    { _id: ctx.params.id, status: 'pending' },
    { status: action === 'confirm' ? 'confirmed' : 'rejected', ...review },
    { returnDocument: 'after' }
  );
  if (!payment) throw new HttpError('This payment has already been reviewed', 409);

  if (action === 'confirm') {
    try {
      await applyPayment(payment.invoiceId, payment.amount);
    } catch (err) {
      await Payment.updateOne({ _id: payment._id }, { status: 'pending' });
      throw err;
    }
    payment.receiptNumber = await nextNumber('receipt', 'OR', 6);
    await payment.save();
  }

  await audit(ctx, `${action}_payment`, 'payment', payment._id, {
    amount: payment.amount,
    receipt: payment.receiptNumber,
  });
  return ok(payment);
});
