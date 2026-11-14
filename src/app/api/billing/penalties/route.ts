import { Invoice, getBillingSettings } from '@/models';
import { audit, ok, route } from '@/lib/api';
import { currentPeriod, formatPeriod, round2 } from '@/lib/format';

// POST /api/billing/penalties — add this month's late charge to overdue statements
export const POST = route({ roles: ['admin'] }, async (ctx) => {
  const settings = await getBillingSettings();
  const rate = settings!.penaltyRatePercent;
  const month = currentPeriod();
  if (rate <= 0) return ok({ charged: 0, amount: 0, rate });

  const overdue = await Invoice.find({
    status: 'open',
    dueDate: { $lt: new Date() },
    penaltyPeriods: { $ne: month },
  }).lean();

  let charged = 0;
  let amount = 0;
  for (const inv of overdue) {
    const penalty = round2(((inv.total - inv.amountPaid) * rate) / 100);
    if (penalty <= 0) continue;
    // The filter repeats the "not yet charged this month" check, so a double click is harmless.
    const updated = await Invoice.findOneAndUpdate(
      { _id: inv._id, status: 'open', penaltyPeriods: { $ne: month } },
      {
        $push: {
          items: {
            kind: 'penalty',
            description: `Late payment charge, ${formatPeriod(month)} (${rate}%)`,
            amount: penalty,
          },
          penaltyPeriods: month,
        },
        $inc: { total: penalty },
      }
    );
    if (updated) {
      charged++;
      amount = round2(amount + penalty);
    }
  }

  await audit(ctx, 'apply_penalties', 'invoice', undefined, { month, charged, amount, rate });
  return ok({ charged, amount, rate });
});
