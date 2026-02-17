import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ParkingRecord } from '@/models';
import { requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const { error } = await requirePermission('reports:export');
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid month or year' },
        { status: 400 }
      );
    }

    await connectDB();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await ParkingRecord.find({
      entryTimestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate('createdBy', 'name')
      .populate('residentId', 'name unitNumber')
      .sort({ entryTimestamp: -1 })
      .lean();

    // Generate CSV
    const headers = [
      'Plate Number',
      'Building',
      'Unit',
      'Slot',
      'Entry Time',
      'Exit Time',
      'Duration (mins)',
      'Status',
      'Created By',
    ];

    const rows = records.map((record) => {
      const entryTime = new Date(record.entryTimestamp).toLocaleString();
      const exitTime = record.exitTimestamp
        ? new Date(record.exitTimestamp).toLocaleString()
        : '';
      const createdBy = ((record.createdBy as unknown) as { name: string })?.name || 'Unknown';
      const duration = record.duration || '';

      return [
        `"${record.plateNumber}"`,
        `"${record.buildingName}"`,
        `"${record.unitNumber}"`,
        `"${record.parkingSlot}"`,
        `"${entryTime}"`,
        `"${exitTime}"`,
        duration,
        `"${record.status}"`,
        `"${createdBy}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=parking-report-${year}-${month.toString().padStart(2, '0')}.csv`,
      },
    });
  } catch (err) {
    console.error('Error generating report:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
