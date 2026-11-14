import { Amenity, Booking } from '@/models';
import { HttpError, audit, isId, ok, parse, route } from '@/lib/api';
import { brand } from '@/lib/brand';
import { round2 } from '@/lib/format';
import { bookingSchema } from '@/lib/validations';
import { findConflict } from '@/lib/bookings';

/** Hour of day (0–24, fractional) and calendar date at the property, whatever the server's timezone. */
function atProperty(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: brand.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    day: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')) + Number(get('minute')) / 60,
  };
}

// GET /api/bookings
//   ?amenityId=&from=&to=  → taken time ranges for the booking form (no personal details)
//   otherwise              → admins: all bookings; residents: their own
export const GET = route({ permission: ['bookings:manage', 'bookings:own'] }, async ({ request, userId, can }) => {
  const sp = request.nextUrl.searchParams;
  const amenityId = sp.get('amenityId');

  if (amenityId && sp.get('from')) {
    if (!isId(amenityId)) throw new HttpError('Invalid amenity');
    const from = new Date(sp.get('from')!);
    const to = new Date(sp.get('to') || from.getTime() + 24 * 60 * 60 * 1000);
    const taken = await Booking.find({
      amenityId,
      status: { $in: ['pending', 'approved'] },
      start: { $lt: to },
      end: { $gt: from },
    })
      .select('start end status')
      .sort({ start: 1 })
      .lean();
    return ok(taken);
  }

  const query: Record<string, unknown> = can('bookings:manage') ? {} : { residentId: userId };
  const status = sp.get('status');
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .sort({ start: -1 })
    .limit(200)
    .populate('amenityId', 'name location')
    .populate('residentId', 'name')
    .lean();
  return ok(bookings);
});

// POST /api/bookings
export const POST = route({ permission: ['bookings:manage', 'bookings:own'] }, async (ctx) => {
  const data = parse(bookingSchema, await ctx.request.json());
  const start = new Date(data.start);
  const end = new Date(data.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new HttpError('Start or end time is not valid');
  }
  if (end <= start) throw new HttpError('End time must be after the start time');
  if (start < new Date()) throw new HttpError('Bookings must start in the future');

  const amenity = await Amenity.findOne({ _id: data.amenityId, isActive: true });
  if (!amenity) throw new HttpError('Amenity is not available', 404);

  const from = atProperty(start);
  const to = atProperty(new Date(end.getTime() - 1));
  const endHour = atProperty(end).hour || 24;
  if (from.day !== to.day || from.hour < amenity.openHour || endHour > amenity.closeHour) {
    throw new HttpError(
      `${amenity.name} is open ${amenity.openHour}:00–${amenity.closeHour}:00. Pick a time inside those hours.`
    );
  }
  if (amenity.capacity && data.guests > amenity.capacity) {
    throw new HttpError(`${amenity.name} holds up to ${amenity.capacity} people`);
  }
  if (amenity.exclusive && (await findConflict(amenity._id, start, end, ['pending', 'approved']))) {
    throw new HttpError('That time overlaps another booking. Pick a different slot.', 409);
  }

  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  const booking = await Booking.create({
    amenityId: amenity._id,
    residentId: ctx.userId,
    buildingName: ctx.session.user.buildingName,
    unitNumber: ctx.session.user.unitNumber,
    start,
    end,
    guests: data.guests,
    purpose: data.purpose,
    fee: round2(hours * amenity.feePerHour),
    status: amenity.requiresApproval && !ctx.can('bookings:manage') ? 'pending' : 'approved',
  });
  await audit(ctx, 'create', 'booking', booking._id, { amenity: amenity.name, start, end });
  return ok(booking, 201);
});
