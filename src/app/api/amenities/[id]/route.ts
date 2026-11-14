import { Amenity } from '@/models';
import { HttpError, audit, ok, parse, route } from '@/lib/api';
import { amenitySchema } from '@/lib/validations';

// PUT /api/amenities/[id]
export const PUT = route({ roles: ['admin'] }, async (ctx) => {
  const data = parse(amenitySchema, await ctx.request.json());
  const amenity = await Amenity.findByIdAndUpdate(ctx.params.id, data, { returnDocument: 'after' });
  if (!amenity) throw new HttpError('Amenity not found', 404);
  await audit(ctx, 'update', 'amenity', amenity._id, { name: amenity.name });
  return ok(amenity);
});

// DELETE /api/amenities/[id] — closes the amenity to new bookings
export const DELETE = route({ roles: ['admin'] }, async (ctx) => {
  const amenity = await Amenity.findByIdAndUpdate(ctx.params.id, { isActive: false }, { returnDocument: 'after' });
  if (!amenity) throw new HttpError('Amenity not found', 404);
  await audit(ctx, 'deactivate', 'amenity', amenity._id, { name: amenity.name });
  return ok(amenity);
});
