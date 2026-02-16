import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ParkingRecord, Vehicle } from '@/models';
import { requirePermission } from '@/lib/rbac';
import { paginationSchema } from '@/lib/validations';

// GET /api/resident/history - Get own parking history
export async function GET(request: NextRequest) {
  const { error, session } = await requirePermission('parking:read_own');
  if (error) return error;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const queryResult = paginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit } = queryResult.data;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const plateNumber = searchParams.get('plateNumber');
    const exportCsv = searchParams.get('export') === 'csv';

    // Get user's vehicles
    const userVehicles = await Vehicle.find({
      ownerId: session!.user.id,
    }).lean();

    const vehiclePlates = userVehicles.map((v) => v.plateNumber);

    // Build query
    const query: Record<string, unknown> = {
      $or: [
        { residentId: session!.user.id },
        { plateNumber: { $in: vehiclePlates } },
      ],
    };

    if (status) {
      query.status = status;
    }

    if (plateNumber) {
      query.plateNumber = { $regex: plateNumber, $options: 'i' };
    }

    if (startDate || endDate) {
      query.entryTimestamp = {};
      if (startDate) {
        (query.entryTimestamp as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (query.entryTimestamp as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    // If exporting CSV, get all records without pagination
    if (exportCsv) {
      const records = await ParkingRecord.find(query)
        .sort({ entryTimestamp: -1 })
        .lean();

      const csv = generateCSV(records as unknown as Array<Record<string, unknown>>);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="parking-history-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    const skip = (page - 1) * limit;

    const [records, total, stats] = await Promise.all([
      ParkingRecord.find(query)
        .sort({ entryTimestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ParkingRecord.countDocuments(query),
      getResidentStats(session!.user.id, vehiclePlates),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records: records.map((r) => ({
          ...r,
          formattedDuration: r.duration ? formatDuration(r.duration) : null,
        })),
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching parking history:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parking history' },
      { status: 500 }
    );
  }
}

async function getResidentStats(userId: string, vehiclePlates: string[]) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const query = {
    $or: [
      { residentId: userId },
      { plateNumber: { $in: vehiclePlates } },
    ],
    entryTimestamp: { $gte: startOfMonth },
  };

  const [monthlyRecords, activeRecords] = await Promise.all([
    ParkingRecord.find(query).lean(),
    ParkingRecord.find({
      $or: [
        { residentId: userId },
        { plateNumber: { $in: vehiclePlates } },
      ],
      status: 'parked',
    }).lean(),
  ]);

  // Calculate stats
  const totalVisitsThisMonth = monthlyRecords.length;
  const exitedRecords = monthlyRecords.filter((r) => r.status === 'exited' && r.duration);
  const averageDuration =
    exitedRecords.length > 0
      ? Math.round(
          exitedRecords.reduce((sum, r) => sum + (r.duration || 0), 0) /
            exitedRecords.length
        )
      : 0;

  // Find most used parking slot
  const slotCounts: Record<string, number> = {};
  monthlyRecords.forEach((r) => {
    slotCounts[r.parkingSlot] = (slotCounts[r.parkingSlot] || 0) + 1;
  });
  const mostUsedSlot =
    Object.entries(slotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    totalVisitsThisMonth,
    averageDuration,
    averageDurationFormatted: formatDuration(averageDuration),
    mostUsedSlot,
    currentlyParked: activeRecords.length,
    activeRecords,
  };
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return '0 mins';
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
}

function generateCSV(records: Array<Record<string, unknown>>): string {
  const headers = [
    'Plate Number',
    'Entry Time',
    'Exit Time',
    'Duration (mins)',
    'Building',
    'Unit',
    'Parking Slot',
    'Status',
  ];

  const rows = records.map((r) => [
    r.plateNumber,
    new Date(r.entryTimestamp as Date).toISOString(),
    r.exitTimestamp ? new Date(r.exitTimestamp as Date).toISOString() : '',
    r.duration || '',
    r.buildingName,
    r.unitNumber,
    r.parkingSlot,
    r.status,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
