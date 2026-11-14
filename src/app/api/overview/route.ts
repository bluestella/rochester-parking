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
export const GET = route({}, async ({ role, session, userId }) => {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const today = { $gte: todayUtc, $lt: new Date(todayUtc.getTime() + DAY) };
  const live = { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };

  if (role === 'resident') {
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
    ParkingSlot.countDocuments({}),
    ParkingSlot.countDocuments({ isOccupied: true }),
    Invoice.find({ period, status: { $ne: 'void' } }).select('total amountPaid').lean(),
    Invoice.find({ status: 'open' }).select('total amountPaid dueDate').lean(),
    Payment.countDocuments({ status: 'pending' }),
    ServiceRequest.find({ status: { $in: ['open', 'in_progress', 'on_hold'] } })
      .sort({ createdAt: -1 })
      .select('ticketNumber title priority status unitNumber buildingName createdAt')
      .lean(),
    Booking.countDocuments({ status: 'pending' }),
    VisitorPass.countDocuments({ expectedDate: today, status: 'expected' }),
    Equipment.find({
      preventativeMaintenanceSchedule: { $lte: new Date(now.getTime() + 14 * DAY) },
    })
      .sort({ preventativeMaintenanceSchedule: 1 })
      .limit(5)
      .select('equipmentId make equipmentModel preventativeMaintenanceSchedule')
      .lean(),
    role === 'admin'
      ? AuditLog.find({}).sort({ timestamp: -1 }).limit(8).populate('userId', 'name').lean()
      : [],
    Unit.countDocuments({ isActive: true }),
  ]);

  const billed = round2(periodInvoices.reduce((s, i) => s + i.total, 0));
  const collected = round2(periodInvoices.reduce((s, i) => s + i.amountPaid, 0));
  const overdue = openInvoices.filter((i) => new Date(i.dueDate) < now);

  return ok({
    role,
    period,
    units,
    parking: { slots, occupied, free: slots - occupied },
    billing:
      role === 'admin'
        ? {
            billed,
            collected,
            collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
            outstanding: round2(openInvoices.reduce((s, i) => s + i.total - i.amountPaid, 0)),
            overdueCount: overdue.length,
            overdueAmount: round2(overdue.reduce((s, i) => s + i.total - i.amountPaid, 0)),
            pendingPayments,
          }
        : null,
    requests: { active: requests.length, urgent: requests.filter((r) => ['urgent', 'high'].includes(r.priority)).length, latest: requests.slice(0, 5) },
    pendingBookings,
    visitorsToday,
    equipmentDue,
    activity,
  });
});
