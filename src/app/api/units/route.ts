import { ParkingSlot, Unit, User } from '@/models';
import { audit, like, ok, pageParams, paginated, parse, route, unitFilterFor } from '@/lib/api';
import { unitSchema } from '@/lib/validations';

// GET /api/units — office staff see every unit; residents see their own
export const GET = route({ permission: ['units:read', 'resident_portal:access'] }, async ({ request, session, can }) => {
  const sp = request.nextUrl.searchParams;
  const { page, limit, skip } = pageParams(request, 50);

  const query: Record<string, unknown> =
    can('units:read') ? { isActive: true } : await unitFilterFor(session);
  if (can('units:read')) {
    const search = sp.get('search');
    if (sp.get('buildingName')) query.buildingName = sp.get('buildingName');
    if (search) {
      const owners = await User.find({ name: like(search) }).select('_id').lean();
      query.$or = [
        { unitNumber: like(search) },
        { tenantName: like(search) },
        { ownerId: { $in: owners.map((o) => o._id) } },
      ];
    }
  }

  const [units, total] = await Promise.all([
    Unit.find(query)
      .sort({ buildingName: 1, unitNumber: 1 })
      .skip(skip)
      .limit(limit)
      .populate('ownerId', 'name email')
      .lean(),
    Unit.countDocuments(query),
  ]);

  const slots = await ParkingSlot.find({ assignedUnitId: { $in: units.map((u) => u._id) } })
    .select('slotCode assignedUnitId monthlyFee')
    .lean();

  return ok({
    units: units.map((unit) => ({
      ...unit,
      slots: slots.filter((s) => String(s.assignedUnitId) === String(unit._id)),
    })),
    pagination: paginated(page, limit, total),
  });
});

// POST /api/units
export const POST = route({ permission: 'units:manage' }, async (ctx) => {
  const data = parse(unitSchema, await ctx.request.json());
  const unit = await Unit.create({ ...data, ownerId: data.ownerId || undefined });
  await audit(ctx, 'create', 'unit', unit._id, {
    unit: `${unit.buildingName} ${unit.unitNumber}`,
  });
  return ok(unit, 201);
});
