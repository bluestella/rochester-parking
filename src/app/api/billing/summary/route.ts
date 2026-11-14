import { Invoice, Payment } from '@/models';
import { ok, route } from '@/lib/api';
import { currentPeriod, round2 } from '@/lib/format';

const DAY = 24 * 60 * 60 * 1000;

// GET /api/billing/summary?period=YYYY-MM — collection and receivables at a glance
export const GET = route({ permission: 'billing:read' }, async ({ request }) => {
  const period = request.nextUrl.searchParams.get('period') || currentPeriod();
  const now = Date.now();

  const [periodInvoices, openInvoices, pendingPayments] = await Promise.all([
    Invoice.find({ period, status: { $ne: 'void' } }).select('total amountPaid status').lean(),
    Invoice.find({ status: 'open' })
      .select('total amountPaid dueDate buildingName unitNumber unitId')
      .lean(),
    Payment.countDocuments({ status: 'pending' }),
  ]);

  const billed = round2(periodInvoices.reduce((s, i) => s + i.total, 0));
  const collected = round2(periodInvoices.reduce((s, i) => s + i.amountPaid, 0));

  const aging = [
    { label: 'Not yet due', amount: 0, count: 0 },
    { label: '1–30 days late', amount: 0, count: 0 },
    { label: '31–60 days late', amount: 0, count: 0 },
    { label: '61–90 days late', amount: 0, count: 0 },
    { label: 'Over 90 days late', amount: 0, count: 0 },
  ];
  const byUnit = new Map<string, { unit: string; balance: number; statements: number }>();
  let outstanding = 0;
  let overdue = 0;

  for (const inv of openInvoices) {
    const balance = inv.total - inv.amountPaid;
    const daysLate = Math.floor((now - new Date(inv.dueDate).getTime()) / DAY);
    const bucket = daysLate <= 0 ? 0 : daysLate <= 30 ? 1 : daysLate <= 60 ? 2 : daysLate <= 90 ? 3 : 4;
    aging[bucket].amount = round2(aging[bucket].amount + balance);
    aging[bucket].count++;
    outstanding += balance;
    if (bucket > 0) {
      overdue += balance;
      const key = String(inv.unitId);
      const row = byUnit.get(key) ?? {
        unit: `${inv.buildingName} ${inv.unitNumber}`,
        balance: 0,
        statements: 0,
      };
      row.balance = round2(row.balance + balance);
      row.statements++;
      byUnit.set(key, row);
    }
  }

  return ok({
    period,
    billed,
    collected,
    collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
    statements: periodInvoices.length,
    paidStatements: periodInvoices.filter((i) => i.status === 'paid').length,
    outstanding: round2(outstanding),
    overdue: round2(overdue),
    pendingPayments,
    aging,
    delinquent: [...byUnit.values()].sort((a, b) => b.balance - a.balance).slice(0, 5),
  });
});
