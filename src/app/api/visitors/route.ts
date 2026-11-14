import { randomInt } from 'crypto';
import { VisitorPass } from '@/models';
import { HttpError, audit, like, ok, parse, route } from '@/lib/api';
import { visitorSchema } from '@/lib/validations';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I)
const newCode = () =>
  Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

/** Visit dates are calendar days at the property, stored at noon UTC so they never drift a day. */
const dayRange = (day: string) => {
  const start = new Date(`${day}T00:00:00Z`);
  return { $gte: start, $lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
};

// GET /api/visitors
//   guards/admins: ?date=YYYY-MM-DD (the gate list for that day), optional ?search=
//   residents: the passes they created
export const GET = route({}, async ({ request, role, userId }) => {
  const sp = request.nextUrl.searchParams;
  const query: Record<string, unknown> = {};

  if (role === 'resident') {
    query.hostId = userId;
  } else {
    const date = sp.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) query.expectedDate = dayRange(date);
    const search = sp.get('search');
    if (search) {
      query.$or = [
        { visitorName: like(search) },
        { plateNumber: like(search) },
        { unitNumber: like(search) },
        { code: like(search) },
      ];
    }
  }

  const visitors = await VisitorPass.find(query)
    .sort({ expectedDate: -1, createdAt: -1 })
    .limit(200)
    .populate('hostId', 'name')
    .lean();
  return ok(visitors);
});

// POST /api/visitors — residents pre-register a guest; guards log a walk-in
export const POST = route({}, async (ctx) => {
  const data = parse(visitorSchema, await ctx.request.json());
  const { user } = ctx.session;
  const isResident = ctx.role === 'resident';

  const buildingName = isResident ? user.buildingName : data.buildingName;
  const unitNumber = isResident ? user.unitNumber : data.unitNumber;
  if (!buildingName || !unitNumber) {
    throw new HttpError(
      isResident
        ? 'Your account has no unit on file. Ask the admin office to add it.'
        : 'Building and unit being visited are required'
    );
  }

  const arrivedNow = !isResident && data.walkIn;
  const pass = await VisitorPass.create({
    code: newCode(),
    visitorName: data.visitorName,
    plateNumber: data.plateNumber || undefined,
    purpose: data.purpose,
    buildingName,
    unitNumber,
    hostId: isResident ? ctx.userId : undefined,
    expectedDate: new Date(`${data.expectedDate}T12:00:00Z`),
    status: arrivedNow ? 'arrived' : 'expected',
    arrivedAt: arrivedNow ? new Date() : undefined,
    handledBy: arrivedNow ? ctx.userId : undefined,
    createdBy: ctx.userId,
  });
  await audit(ctx, 'create', 'visitor_pass', pass._id, { visitor: pass.visitorName, code: pass.code });
  return ok(pass, 201);
});
