/**
 * Demo data for local development.
 *
 * WARNING: this wipes every collection the app uses before inserting.
 * It refuses to run with NODE_ENV=production unless you pass --force.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  Amenity,
  Announcement,
  AuditLog,
  BillingSettings,
  Booking,
  Building,
  Counter,
  Equipment,
  Invoice,
  ParkingRecord,
  ParkingSlot,
  Payment,
  ServiceRequest,
  Unit,
  User,
  Vehicle,
  VisitorPass,
} from '../src/models';
import { applyPayment, runMonthlyBilling } from '../src/lib/billing';

const DAY = 24 * 60 * 60 * 1000;
const period = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in .env.local first.');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to wipe a production database. Pass --force if you really mean it.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected. Clearing existing data…');
  await Promise.all(
    [User, Building, Unit, ParkingSlot, Vehicle, ParkingRecord, BillingSettings, Invoice, Payment,
      Amenity, Booking, ServiceRequest, Announcement, VisitorPass, Equipment, AuditLog, Counter,
    ].map((model) => (model as mongoose.Model<unknown>).deleteMany({}))
  );

  // --- People -------------------------------------------------------------
  const hash = (pw: string) => bcrypt.hash(pw, 12);
  const admin = await User.create({ name: 'Maria Santos', email: 'admin@parktrack.com', passwordHash: await hash('admin123'), role: 'admin' });
  await User.create({ name: 'Ramon Cruz', email: 'guard@parktrack.com', passwordHash: await hash('guard123'), role: 'guard', createdBy: admin._id });

  const residentHash = await hash('resident123');
  const people = [
    ['John Reyes', 'resident@parktrack.com', 'Tower A', '12A'],
    ['Jane Lim', 'jane@example.com', 'Tower B', '305'],
    ['Carlos Mendoza', 'carlos@example.com', 'Tower A', '8C'],
    ['Aiko Tan', 'aiko@example.com', 'Tower B', '1102'],
    ['Liza Ramos', 'liza@example.com', 'Tower A', '15B'],
    ['Paolo Garcia', 'paolo@example.com', 'Tower B', '706'],
  ] as const;
  const residents = await User.insertMany(
    people.map(([name, email, buildingName, unitNumber]) => ({
      name, email, buildingName, unitNumber, passwordHash: residentHash, role: 'resident', createdBy: admin._id,
    }))
  );

  // --- Property -----------------------------------------------------------
  await Building.insertMany([
    { name: 'Tower A', code: 'TA', floors: 20, address: '1 Rochester Street', createdBy: admin._id },
    { name: 'Tower B', code: 'TB', floors: 18, address: '3 Rochester Street', createdBy: admin._id },
  ]);

  const areas = [42, 68, 35, 96, 54, 61];
  const types = ['1br', '2br', 'studio', '3br', '2br', '2br'];
  const units = await Unit.insertMany(
    people.map(([, , buildingName, unitNumber], i) => ({
      buildingName, unitNumber, type: types[i], areaSqm: areas[i], ownerId: residents[i]._id,
      occupancy: i === 3 ? 'tenanted' : 'owner_occupied', tenantName: i === 3 ? 'Mark Dela Cruz' : undefined,
      floor: unitNumber.replace(/\D+$/, '').slice(0, -2) || unitNumber.replace(/\D/g, ''),
    }))
  );

  // --- Parking ------------------------------------------------------------
  const slots = [];
  for (const [tower, code] of [['Tower A', 'A'], ['Tower B', 'B']] as const) {
    for (const [floor, prefix] of [['Basement 1', 'B1'], ['Podium 1', 'P1']] as const) {
      for (let i = 1; i <= 12; i++) {
        slots.push({
          slotCode: `${prefix}-${code}${String(i).padStart(2, '0')}`,
          buildingName: tower,
          floor,
          type: i === 1 ? 'pwd' : i === 12 ? 'motorcycle' : 'visitor',
        });
      }
    }
  }
  await ParkingSlot.insertMany(slots);
  // Reserve a slot for the first four units; one pays a premium rate.
  const reserved = ['B1-A02', 'B1-B02', 'B1-A03', 'B1-B03'];
  for (let i = 0; i < reserved.length; i++) {
    await ParkingSlot.updateOne(
      { slotCode: reserved[i] },
      { type: 'assigned', assignedUnitId: units[i]._id, ...(i === 3 ? { monthlyFee: 2000 } : {}) }
    );
  }

  const cars = [
    ['ABC 1234', 'Toyota', 'Vios', 'Silver'], ['NGA 4821', 'Honda', 'Civic', 'Black'],
    ['DAJ 7305', 'Mitsubishi', 'Xpander', 'White'], ['NFX 2290', 'Ford', 'Everest', 'Grey'],
  ];
  const vehicles = await Vehicle.insertMany(
    cars.map(([plateNumber, make, vehicleModel, color], i) => ({
      plateNumber, make, vehicleModel, color, ownerId: residents[i]._id,
      buildingName: people[i][2], unitNumber: people[i][3], createdBy: residents[i]._id,
    }))
  );

  const now = Date.now();
  for (let i = 0; i < 3; i++) {
    await ParkingRecord.create({
      plateNumber: cars[i][0], buildingName: people[i][2], unitNumber: people[i][3], parkingSlot: reserved[i],
      entryTimestamp: new Date(now - (i + 1) * 3 * 60 * 60 * 1000), status: 'parked',
      vehicleId: vehicles[i]._id, residentId: residents[i]._id, createdBy: admin._id,
    });
    await ParkingSlot.updateOne({ slotCode: reserved[i] }, { isOccupied: true, currentVehicle: cars[i][0] });
  }
  await ParkingRecord.create({
    plateNumber: 'TXI 9911', buildingName: 'Tower A', unitNumber: '8C', parkingSlot: 'P1-A05',
    entryTimestamp: new Date(now - 26 * 60 * 60 * 1000), exitTimestamp: new Date(now - 24 * 60 * 60 * 1000),
    duration: 120, status: 'exited', createdBy: admin._id, updatedBy: admin._id,
  });
  await ParkingRecord.create({
    plateNumber: 'WQP 5512', buildingName: 'Tower B', unitNumber: '706', parkingSlot: 'P1-B04',
    entryTimestamp: new Date(now - 40 * 60 * 1000), status: 'parked', createdBy: admin._id,
  });
  await ParkingSlot.updateOne({ slotCode: 'P1-B04' }, { isOccupied: true, currentVehicle: 'WQP 5512' });

  // --- Billing ------------------------------------------------------------
  await BillingSettings.create({
    key: 'default', duesRatePerSqm: 85, parkingFee: 1500, dueDay: 15, penaltyRatePercent: 2,
    paymentInstructions:
      'Bank transfer: Rochester Condominium Corp., BDO 0012-3456-7890.\nE-wallet: 0917 555 0142.\nCashier: admin office, Tower A lobby, Monday to Saturday, 9am to 5pm.',
  });

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  await runMonthlyBilling(period(lastMonth), String(admin._id));
  // Last month's statements were due on the 15th of that month: make them overdue.
  await Invoice.updateMany({ period: period(lastMonth) }, { dueDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15) });
  await runMonthlyBilling(period(today), String(admin._id));

  const pay = async (unitIndex: number, p: string, fraction: number, method: string) => {
    const invoice = await Invoice.findOne({ unitId: units[unitIndex]._id, period: p });
    if (!invoice) return;
    const amount = Math.round(invoice.total * fraction * 100) / 100;
    await applyPayment(invoice._id, amount);
    const counter = await Counter.findOneAndUpdate({ key: 'receipt' }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
    await Payment.create({
      invoiceId: invoice._id, unitId: invoice.unitId, amount, method, status: 'confirmed',
      receiptNumber: `OR-${String(counter!.seq).padStart(6, '0')}`, paidAt: new Date(now - 5 * DAY),
      submittedBy: admin._id, reviewedBy: admin._id, reviewedAt: new Date(now - 5 * DAY),
    });
  };
  // Last month: four paid in full, one half-paid, one unpaid. This month: two early payers.
  for (const i of [0, 1, 2, 3]) await pay(i, period(lastMonth), 1, i % 2 ? 'bank_transfer' : 'cash');
  await pay(4, period(lastMonth), 0.5, 'e_wallet');
  await pay(1, period(today), 1, 'bank_transfer');
  await pay(3, period(today), 1, 'check');

  // A resident has reported a transfer that the office has not confirmed yet.
  const johnsInvoice = await Invoice.findOne({ unitId: units[0]._id, period: period(today) });
  if (johnsInvoice) {
    await Payment.create({
      invoiceId: johnsInvoice._id, unitId: johnsInvoice.unitId, amount: johnsInvoice.total,
      method: 'bank_transfer', reference: 'BDO-88213904', status: 'pending', submittedBy: residents[0]._id,
    });
  }

  // --- Facilities ---------------------------------------------------------
  const [hall, pool, gym] = await Amenity.insertMany([
    { name: 'Function hall', location: 'Tower A, 5th floor', capacity: 80, openHour: 8, closeHour: 22, feePerHour: 1500, exclusive: true, requiresApproval: true, description: 'Tables and chairs for 80. No confetti. Clean-up is the host’s responsibility.' },
    { name: 'Swimming pool', location: 'Podium deck', capacity: 30, openHour: 6, closeHour: 21, feePerHour: 0, exclusive: false, requiresApproval: false, description: 'Shower before entering. Children must be accompanied by an adult.' },
    { name: 'Gym', location: 'Tower B, 2nd floor', capacity: 15, openHour: 5, closeHour: 23, feePerHour: 0, exclusive: false, requiresApproval: false },
    { name: 'Basketball court', location: 'Podium deck', capacity: 20, openHour: 7, closeHour: 21, feePerHour: 300, exclusive: true, requiresApproval: true },
  ]);
  // Amenity hours are checked in the property's timezone (Asia/Manila, UTC+8).
  const at = (days: number, hour: number) => {
    const d = new Date(now + days * DAY + 8 * 60 * 60 * 1000);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour - 8));
  };
  await Booking.insertMany([
    { amenityId: hall._id, residentId: residents[1]._id, buildingName: 'Tower B', unitNumber: '305', start: at(6, 14), end: at(6, 18), guests: 45, purpose: 'Birthday party', fee: 6000, status: 'pending' },
    { amenityId: hall._id, residentId: residents[2]._id, buildingName: 'Tower A', unitNumber: '8C', start: at(12, 10), end: at(12, 12), guests: 20, purpose: 'Homeowners meeting', fee: 3000, status: 'approved', decidedBy: admin._id },
    { amenityId: pool._id, residentId: residents[0]._id, buildingName: 'Tower A', unitNumber: '12A', start: at(2, 9), end: at(2, 11), guests: 4, fee: 0, status: 'approved' },
    { amenityId: gym._id, residentId: residents[0]._id, buildingName: 'Tower A', unitNumber: '12A', start: at(-3, 6), end: at(-3, 7), guests: 1, fee: 0, status: 'approved' },
  ]);

  const ticket = (n: number) => `SR-${String(n).padStart(5, '0')}`;
  await ServiceRequest.insertMany([
    { ticketNumber: ticket(1), title: 'Kitchen sink is leaking', description: 'Water drips from the pipe under the sink whenever the tap runs. Started two days ago.', category: 'plumbing', priority: 'high', status: 'in_progress', location: 'In my unit', buildingName: 'Tower A', unitNumber: '12A', requesterId: residents[0]._id, assignee: 'Jun (in-house plumber)',
      updates: [
        { at: new Date(now - 2 * DAY), byName: 'John Reyes', byRole: 'resident', status: 'open', note: 'Request filed' },
        { at: new Date(now - 1 * DAY), byName: 'Maria Santos', byRole: 'admin', status: 'in_progress', note: 'Jun will come by tomorrow between 9 and 11am.' },
      ] },
    { ticketNumber: ticket(2), title: 'Elevator 2 stops between floors', description: 'The second elevator in Tower B jolted and stopped briefly between the 6th and 7th floor this morning.', category: 'elevator', priority: 'urgent', status: 'open', location: 'Tower B, elevator 2', buildingName: 'Tower B', unitNumber: '706', requesterId: residents[5]._id,
      updates: [{ at: new Date(now - 3 * 60 * 60 * 1000), byName: 'Paolo Garcia', byRole: 'resident', status: 'open', note: 'Request filed' }] },
    { ticketNumber: ticket(3), title: 'Hallway light out on 11th floor', description: 'The light outside unit 1102 has been off since the weekend.', category: 'electrical', priority: 'normal', status: 'open', location: 'Tower B, 11th floor hallway', buildingName: 'Tower B', unitNumber: '1102', requesterId: residents[3]._id,
      updates: [{ at: new Date(now - 1 * DAY), byName: 'Aiko Tan', byRole: 'resident', status: 'open', note: 'Request filed' }] },
    { ticketNumber: ticket(4), title: 'Aircon drain dripping onto balcony', description: 'Fixed by cleaning the drain line.', category: 'aircon', priority: 'low', status: 'resolved', buildingName: 'Tower A', unitNumber: '15B', requesterId: residents[4]._id, resolvedAt: new Date(now - 6 * DAY),
      updates: [
        { at: new Date(now - 9 * DAY), byName: 'Liza Ramos', byRole: 'resident', status: 'open', note: 'Request filed' },
        { at: new Date(now - 6 * DAY), byName: 'Maria Santos', byRole: 'admin', status: 'resolved', note: 'Drain line cleared.' },
      ] },
  ]);
  await Counter.create({ key: 'ticket', seq: 4 });

  await Equipment.insertMany([
    { equipmentId: 'GEN-001', make: 'Cummins', equipmentModel: 'C275D5', preventativeMaintenanceSchedule: new Date(now + 5 * DAY), operatorDetails: 'PowerServ Inc., 0917 555 0188', partsInventory: 'Oil filter, fuel filter, coolant', createdBy: admin._id },
    { equipmentId: 'ELV-B2', make: 'Schindler', equipmentModel: '3300', preventativeMaintenanceSchedule: new Date(now - 2 * DAY), operatorDetails: 'Schindler service desk', createdBy: admin._id },
    { equipmentId: 'PMP-01', make: 'Grundfos', equipmentModel: 'CR 15-4', preventativeMaintenanceSchedule: new Date(now + 40 * DAY), operatorDetails: 'In-house engineering', createdBy: admin._id },
  ]);

  // --- Community ----------------------------------------------------------
  await Announcement.insertMany([
    { title: 'Water interruption this Saturday, 9am to 1pm', body: 'The cistern tank will be cleaned. Water supply to both towers is off from 9am to 1pm. Please store enough water beforehand.', category: 'maintenance', pinned: true, createdBy: admin._id },
    { title: 'Elevator 2 in Tower B under inspection', body: 'Please use elevators 1 and 3 while the contractor checks elevator 2.', category: 'notice', buildingName: 'Tower B', publishedAt: new Date(now - 2 * 60 * 60 * 1000), createdBy: admin._id },
    { title: 'Christmas lighting ceremony', body: 'Join us at the podium deck on December 1 at 6pm. Snacks will be served.', category: 'event', publishedAt: new Date(now - 3 * DAY), createdBy: admin._id },
  ]);

  const noon = (days: number) => new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + days, 12));
  await VisitorPass.insertMany([
    { code: 'K7M2QX', visitorName: 'Elena Reyes', plateNumber: 'PIA 3310', purpose: 'Family', buildingName: 'Tower A', unitNumber: '12A', hostId: residents[0]._id, expectedDate: noon(0), status: 'expected', createdBy: residents[0]._id },
    { code: 'R4T9WB', visitorName: 'Aircon technician (CoolAir)', purpose: 'Aircon cleaning', buildingName: 'Tower B', unitNumber: '305', hostId: residents[1]._id, expectedDate: noon(0), status: 'arrived', arrivedAt: new Date(now - 60 * 60 * 1000), createdBy: residents[1]._id },
    { code: 'H2C8LN', visitorName: 'Miguel Santos', purpose: 'Dinner guest', buildingName: 'Tower A', unitNumber: '12A', hostId: residents[0]._id, expectedDate: noon(2), status: 'expected', createdBy: residents[0]._id },
  ]);

  console.log('\nSeed complete.');
  console.log('  Admin:    admin@parktrack.com / admin123');
  console.log('  Guard:    guard@parktrack.com / guard123');
  console.log('  Resident: resident@parktrack.com / resident123');
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
