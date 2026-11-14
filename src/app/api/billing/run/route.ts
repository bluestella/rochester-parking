import { z } from 'zod';
import { audit, ok, parse, route } from '@/lib/api';
import { runMonthlyBilling } from '@/lib/billing';
import { periodSchema } from '@/lib/validations';

// POST /api/billing/run — issue monthly statements for every active unit
export const POST = route({ permission: 'billing:manage' }, async (ctx) => {
  const { period } = parse(z.object({ period: periodSchema }), await ctx.request.json());
  const result = await runMonthlyBilling(period, ctx.userId);
  await audit(ctx, 'billing_run', 'invoice', undefined, result);
  return ok(result);
});
