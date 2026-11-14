import { Invoice } from '@/models';
import { route } from '@/lib/api';
import { displayStatus } from '@/lib/billing';
import { csvResponse, toCsv } from '@/lib/csv';
import { currentPeriod, formatDate, round2 } from '@/lib/format';
import { NextResponse } from 'next/server';

// GET /api/billing/export?period=YYYY-MM — statements for the period as CSV
export const GET = route({ roles: ['admin'] }, async ({ request }) => {
  const period = request.nextUrl.searchParams.get('period') || currentPeriod();
  const invoices = await Invoice.find({ period }).sort({ buildingName: 1, unitNumber: 1 }).lean();
  const csv = toCsv(
    ['Statement', 'Building', 'Unit', 'Period', 'Total', 'Paid', 'Balance', 'Status', 'Due date'],
    invoices.map((i) => [
      i.number,
      i.buildingName,
      i.unitNumber,
      i.period,
      i.total,
      i.amountPaid,
      i.status === 'void' ? 0 : round2(i.total - i.amountPaid),
      displayStatus(i),
      formatDate(i.dueDate),
    ])
  );
  return csvResponse(`statements-${period}.csv`, csv) as NextResponse;
});
