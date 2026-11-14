import { BillingSettings, getBillingSettings } from '@/models';
import { audit, ok, parse, route } from '@/lib/api';
import { billingSettingsSchema } from '@/lib/validations';

// GET /api/billing/settings — everyone signed in can read rates and how to pay
export const GET = route({}, async () => ok(await getBillingSettings()));

// PUT /api/billing/settings
export const PUT = route({ roles: ['admin'] }, async (ctx) => {
  const data = parse(billingSettingsSchema, await ctx.request.json());
  const settings = await BillingSettings.findOneAndUpdate(
    { key: 'default' },
    { ...data, updatedBy: ctx.userId },
    { returnDocument: 'after', upsert: true }
  );
  await audit(ctx, 'update', 'billing_settings', settings!._id, data);
  return ok(settings);
});
