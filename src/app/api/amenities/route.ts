import { Amenity } from '@/models';
import { audit, ok, parse, route } from '@/lib/api';
import { amenitySchema } from '@/lib/validations';

// GET /api/amenities
export const GET = route({}, async ({ role }) =>
  ok(await Amenity.find(role === 'admin' ? {} : { isActive: true }).sort({ name: 1 }).lean())
);

// POST /api/amenities
export const POST = route({ roles: ['admin'] }, async (ctx) => {
  const amenity = await Amenity.create(parse(amenitySchema, await ctx.request.json()));
  await audit(ctx, 'create', 'amenity', amenity._id, { name: amenity.name });
  return ok(amenity, 201);
});
