import {
  Announcement,
  AuditLog,
  Booking,
  Equipment,
  Invoice,
  ParkingRecord,
  ParkingSlot,
  Payment,
  ServiceRequest,
  Unit,
  VisitorPass,
} from '@/models';
import { ok, route, unitFilterFor } from '@/lib/api';
import { invoiceView } from '@/lib/billing';
import { currentPeriod, round2 } from '@/lib/format';

const DAY = 24 * 60 * 60 * 1000;

// GET /api/overview — the numbers behind the home page for each role
export const GET = route({}, async ({ role, session, userId, can }) => {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const today = { $gte: todayUtc, $lt: new Date(todayUtc.getTime() + DAY) };
  const live = { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };

  if (!can('dashboard:view')) {
    const units = await Unit.find(await unitFilterFor(session)).lean();
    const unitIds = units.map((u) => u._id);
    const [openInvoices, bookings, requests, visitors, announcements, parked] = await Promise.all([
      Invoice.find({ unitId: { $in: unitIds }, status: 'open' }).sort({ dueDate: 1 }).lean(),
      Booking.find({ residentId: userId, status: { $in: ['pending', 'approved'] }, end: { $gt: now } })
        .sort({ start: 1 })
        .limit(3)
        .populate('amenityId', 'name')
        .lean(),
      ServiceRequest.find({ requesterId: userId, status: { $in: ['open', 'in_progress', 'on_hold'] } })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      VisitorPass.find({ hostId: userId, status: 'expected', expectedDate: { $gte: todayUtc } })
        .sort({ expectedDate: 1 })
        .limit(3)
        .lean(),
      Announcement.find({
        $and: [live, { $or: [{ buildingName: { $in: [null, ''] } }, { buildingName: session.user.buildingName }] }],
      })
        .sort({ pinned: -1, publishedAt: -1 })
        .limit(4)
        .lean(),
      ParkingRecord.find({ residentId: userId, status: 'parked' }).lean(),
    ]);
    const views = openInvoices.map(invoiceView);
    return ok({
      role,
      units,
      balance: round2(views.reduce((s, i) => s + i.balance, 0)),
      overdue: views.filter((i) => i.displayStatus === 'overdue').length,
      nextDue: views[0] ?? null,
      bookings,
      requests,
      visitors,
      announcements,
      parked,
    });
  }

  // Office roles: each block is only computed for people allowed to see it.
  const show = {
    parking: can('parking:read') || can('parking_slots:read'),
    billing: can('billing:read'),
    requests: can('requests:read_all'),
    bookings: can('bookings:manage'),
    visitors: can('visitors:manage'),
    equipment: can('equipment:read'),
    activity: can('audit:read'),
  };
  const none = <T,>(value: T) => Promise.resolve(value);

  const period = currentPeriod();
  const [
    slots,
    occupied,
    periodInvoices,
    openInvoices,
    pendingPayments,
    requests,
    pendingBookings,
    visitorsToday,
    equipmentDue,
    activity,
    units,
  ] = await Promise.all([
    show.parking ? ParkingSlot.countDocuments({}) : none(0),
    show.parking ? ParkingSlot.countDocuments({ isOccupied: true }) : none(0),
    show.billing
      ? Invoice.find({ period, status: { $ne: 'void' } }).select('total amountPaid').lean()
      : none([]),
    show.billing ? Invoice.find({ status: 'open' }).select('total amountPaid dueDate').lean() : none([]),
    show.billing ? Payment.countDocuments({ status: 'pending' }) : none(0),
    show.requests
      ? ServiceRequest.find({ status: { $in: ['open', 'in_progress', 'on_hold'] } })
          .sort({ createdAt: -1 })
          .select('ticketNumber title priority status unitNumber buildingName createdAt')
          .lean()
      : none([]),
    show.bookings ? Booking.countDocuments({ status: 'pending' }) : none(0),
    show.visitors ? VisitorPass.countDocuments({ expectedDate: today, status: 'expected' }) : none(0),
    show.equipment
      ? Equipment.find({
          preventativeMaintenanceSchedule: { $lte: new Date(now.getTime() + 14 * DAY) },
        })
          .sort({ preventativeMaintenanceSchedule: 1 })
          .limit(5)
          .select('equipmentId make equipmentModel preventativeMaintenanceSchedule')
          .lean()
      : none([]),
    show.activity
      ? AuditLog.find({}).sort({ timestamp: -1 }).limit(8).populate('userId', 'name').lean()
      : none([]),
    Unit.countDocuments({ isActive: true }),
  ]);

  const billed = round2(periodInvoices.reduce((s, i) => s + i.total, 0));
  const collected = round2(periodInvoices.reduce((s, i) => s + i.amountPaid, 0));
  const overdue = openInvoices.filter((i) => new Date(i.dueDate) < now);

  return ok({
    role,
    period,
    units,
    parking: show.parking ? { slots, occupied, free: slots - occupied } : null,
    billing: show.billing
      ? {
          billed,
          collected,
          collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
          outstanding: round2(openInvoices.reduce((s, i) => s + i.total - i.amountPaid, 0)),
          overdueCount: overdue.length,
          overdueAmount: round2(overdue.reduce((s, i) => s + i.total - i.amountPaid, 0)),
          pendingPayments,
          // Only people who can confirm payments get them in their work queue.
          canConfirm: can('billing:manage'),
        }
      : null,
    requests: show.requests
      ? {
          active: requests.length,
          urgent: requests.filter((r) => ['urgent', 'high'].includes(r.priority)).length,
          latest: requests.slice(0, 5),
        }
      : null,
    pendingBookings,
    visitorsToday,
    equipmentDue,
    activity,
  });
});
