import type { Types } from 'mongoose';
import {
  Invoice,
  ParkingSlot,
  Unit,
  getBillingSettings,
  type IInvoice,
  type IInvoiceItem,
} from '@/models';
import { HttpError, nextNumber } from './api';
import { formatPeriod, round2 } from './format';

export type DisplayStatus = 'paid' | 'void' | 'overdue' | 'partial' | 'unpaid';

export function displayStatus(
  inv: Pick<IInvoice, 'status' | 'dueDate' | 'amountPaid'>,
  now = new Date()
): DisplayStatus {
  if (inv.status === 'paid') return 'paid';
  if (inv.status === 'void') return 'void';
  if (new Date(inv.dueDate) < now) return 'overdue';
  return inv.amountPaid > 0 ? 'partial' : 'unpaid';
}

export function invoiceView<T extends Pick<IInvoice, 'status' | 'dueDate' | 'amountPaid' | 'total'>>(
  inv: T
) {
  return {
    ...inv,
    balance: inv.status === 'void' ? 0 : round2(inv.total - inv.amountPaid),
    displayStatus: displayStatus(inv),
  };
}

export function sumItems(items: IInvoiceItem[]) {
  return round2(items.reduce((sum, item) => sum + item.amount, 0));
}

function dueDateFor(period: string, dueDay: number) {
  const [year, month] = period.split('-').map(Number);
  const scheduled = new Date(year, month - 1, dueDay, 23, 59, 59);
  const earliest = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return scheduled > earliest ? scheduled : earliest;
}

/**
 * Issues one monthly statement per active unit. Safe to run twice: the
 * unique `runKey` makes units that were already billed for the period skip.
 */
export async function runMonthlyBilling(period: string, createdBy: string) {
  const settings = await getBillingSettings();
  const units = await Unit.find({ isActive: true }).lean();
  const slots = await ParkingSlot.find({
    type: 'assigned',
    assignedUnitId: { $in: units.map((u) => u._id) },
  }).lean();

  const slotsByUnit = new Map<string, typeof slots>();
  for (const slot of slots) {
    const key = String(slot.assignedUnitId);
    slotsByUnit.set(key, [...(slotsByUnit.get(key) ?? []), slot]);
  }

  const dueDate = dueDateFor(period, settings!.dueDay);
  let created = 0;
  let skipped = 0;
  let billed = 0;

  for (const unit of units) {
    const runKey = `${unit._id}:${period}`;
    if (await Invoice.exists({ runKey })) {
      skipped++;
      continue;
    }

    const items: IInvoiceItem[] = [
      {
        kind: 'dues',
        description: `Association dues, ${formatPeriod(period)} (${unit.areaSqm} sqm × ${settings!.duesRatePerSqm})`,
        amount: round2(unit.areaSqm * settings!.duesRatePerSqm),
      },
    ];
    for (const slot of slotsByUnit.get(String(unit._id)) ?? []) {
      items.push({
        kind: 'parking',
        description: `Parking slot ${slot.slotCode}`,
        amount: round2(slot.monthlyFee ?? settings!.parkingFee),
      });
    }

    try {
      const total = sumItems(items);
      await Invoice.create({
        number: await nextNumber(`invoice:${period}`, `SOA-${period.replace('-', '')}`),
        unitId: unit._id,
        buildingName: unit.buildingName,
        unitNumber: unit.unitNumber,
        period,
        runKey,
        items,
        total,
        dueDate,
        createdBy,
      });
      created++;
      billed = round2(billed + total);
    } catch (err) {
      // Another run billed this unit between the check and the insert.
      if ((err as { code?: number }).code === 11000) skipped++;
      else throw err;
    }
  }

  return { period, created, skipped, billed, units: units.length };
}

/**
 * Applies a confirmed payment in a single atomic update, so two cashiers
 * cannot both settle the same balance.
 */
export async function applyPayment(invoiceId: Types.ObjectId | string, amount: number) {
  const updated = await Invoice.findOneAndUpdate(
    {
      _id: invoiceId,
      status: 'open',
      $expr: { $lte: [{ $add: ['$amountPaid', amount] }, { $add: ['$total', 0.005] }] },
    },
    [
      { $set: { amountPaid: { $round: [{ $add: ['$amountPaid', amount] }, 2] } } },
      {
        $set: {
          status: { $cond: [{ $gte: ['$amountPaid', '$total'] }, 'paid', 'open'] },
          paidAt: { $cond: [{ $gte: ['$amountPaid', '$total'] }, '$$NOW', '$paidAt'] },
        },
      },
    ],
    { returnDocument: 'after', updatePipeline: true }
  );
  if (!updated) {
    throw new HttpError('Payment is more than the balance, or the statement is no longer open');
  }
  return updated;
}
