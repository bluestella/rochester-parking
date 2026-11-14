import type { Types } from 'mongoose';
import { Booking } from '@/models';

/** An existing booking of the same amenity that overlaps the given time range. */
export async function findConflict(
  amenityId: Types.ObjectId | string,
  start: Date,
  end: Date,
  statuses: string[],
  excludeId?: Types.ObjectId | string
) {
  return Booking.findOne({
    amenityId,
    status: { $in: statuses },
    start: { $lt: end },
    end: { $gt: start },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();
}
