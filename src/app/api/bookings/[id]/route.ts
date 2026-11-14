import { z } from 'zod';
import { Amenity, Booking, Invoice, Unit } from '@/models';
import { HttpError, audit, nextNumber, ok, parse, route } from '@/lib/api';
import { currentPeriod, formatDate } from '@/lib/format';
import { findConflict } from '@/lib/bookings';

const schema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
  note: z.string().trim().max(500).optional(),
});

// PATCH /api/bookings/[id]
export const PATCH = route({ roles: ['admin', 'resident'] }, async (ctx) => {
  const { action, note } = parse(schema, await ctx.request.json());
  const booking = await Booking.findById(ctx.params.id);
  if (!booking) throw new HttpError('Booking not found', 404);

  if (action === 'cancel') {
    const isOwner = String(booking.residentId) === ctx.userId;
    if (ctx.role !== 'admin' && !isOwner) throw new HttpError('Booking not found', 404);
    if (!['pending', 'approved'].includes(booking.status)) {
      throw new HttpError('This booking is already closed');
    }
    booking.status = 'cancelled';
  } else {
    if (ctx.role !== 'admin') throw new HttpError('Forbidden', 403);
    if (booking.status !== 'pending') throw new HttpError('This booking has already been decided');

    if (action === 'approve') {
      const amenity = await Amenity.findById(booking.amenityId);
      if (
        amenity?.exclusive &&
        (await findConflict(booking.amenityId, booking.start, booking.end, ['approved'], booking._id))
      ) {
        throw new HttpError('Another approved booking overlaps this time', 409);
      }
      booking.status = 'approved';

      // Charge the usage fee to the resident's unit so it lands on their statement of account.
      if (booking.fee > 0 && booking.buildingName && booking.unitNumber) {
        const unit = await Unit.findOne({
          buildingName: booking.buildingName,
          unitNumber: booking.unitNumber.toUpperCase(),
        });
        if (unit) {
          const period = currentPeriod();
          await Invoice.create({
            number: await nextNumber(`invoice:${period}`, `SOA-${period.replace('-', '')}`),
            unitId: unit._id,
            buildingName: unit.buildingName,
            unitNumber: unit.unitNumber,
            period,
            items: [
              {
                kind: 'amenity',
                description: `${amenity?.name ?? 'Amenity'} booking, ${formatDate(booking.start)}`,
                amount: booking.fee,
              },
            ],
            total: booking.fee,
            dueDate: booking.start,
            createdBy: ctx.userId,
          });
        }
      }
    } else {
      booking.status = 'rejected';
    }
    booking.decidedBy = ctx.userId as never;
    booking.decisionNote = note;
  }

  await booking.save();
  await audit(ctx, action, 'booking', booking._id);
  return ok(booking);
});
