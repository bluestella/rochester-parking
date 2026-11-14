import { Invoice, ParkingSlot, Unit } from '@/models';
import { HttpError, audit, ok, parse, route } from '@/lib/api';
import { unitSchema } from '@/lib/validations';

// PUT /api/units/[id]
export const PUT = route({ permission: 'units:manage' }, async (ctx) => {
  const data = parse(unitSchema.partial(), await ctx.request.json());
  const update: Record<string, unknown> = { ...data };
  const unset: Record<string, 1> = {};
  if ('ownerId' in data && !data.ownerId) {
    delete update.ownerId;
    unset.ownerId = 1;
  }
  const unit = await Unit.findByIdAndUpdate(
    ctx.params.id,
    { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { returnDocument: 'after', runValidators: true }
  );
  if (!unit) throw new HttpError('Unit not found', 404);
  await audit(ctx, 'update', 'unit', unit._id, { changes: Object.keys(data) });
  return ok(unit);
});

// DELETE /api/units/[id] — retire a unit; its billing history is kept
export const DELETE = route({ permission: 'units:delete' }, async (ctx) => {
  const open = await Invoice.countDocuments({ unitId: ctx.params.id, status: 'open' });
  if (open > 0) {
    throw new HttpError(`This unit has ${open} unpaid statement(s). Settle or void them first.`);
  }
  const unit = await Unit.findByIdAndUpdate(ctx.params.id, { isActive: false }, { returnDocument: 'after' });
  if (!unit) throw new HttpError('Unit not found', 404);
  await ParkingSlot.updateMany({ assignedUnitId: unit._id }, { assignedUnitId: null });
  await audit(ctx, 'delete', 'unit', unit._id, {
    unit: `${unit.buildingName} ${unit.unitNumber}`,
  });
  return ok({ removed: true });
});
