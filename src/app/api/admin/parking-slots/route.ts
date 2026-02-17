import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ParkingSlot, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { createParkingSlotSchema, paginationSchema } from '@/lib/validations';

// GET /api/admin/parking-slots - Get all parking slots with pagination
export async function GET(request: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    if (!paginationResult.success) {
      return NextResponse.json(
        { success: false, error: paginationResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit } = paginationResult.data;
    const search = searchParams.get('search') || undefined;
    const buildingName = searchParams.get('buildingName') || undefined;
    const isOccupied = searchParams.get('isOccupied');

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { slotCode: { $regex: search, $options: 'i' } },
        { buildingName: { $regex: search, $options: 'i' } },
        { floor: { $regex: search, $options: 'i' } },
      ];
    }

    if (buildingName) {
      query.buildingName = buildingName;
    }

    if (isOccupied === 'true') {
      query.isOccupied = true;
    } else if (isOccupied === 'false') {
      query.isOccupied = false;
    }

    const skip = (page - 1) * limit;

    const [slots, total] = await Promise.all([
      ParkingSlot.find(query)
        .sort({ slotCode: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ParkingSlot.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        slots,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching parking slots:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parking slots' },
      { status: 500 }
    );
  }
}

// POST /api/admin/parking-slots - Create parking slot
export async function POST(request: NextRequest) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = createParkingSlotSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if slot already exists
    const existingSlot = await ParkingSlot.findOne({ slotCode: data.slotCode });
    if (existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Slot code already exists' },
        { status: 400 }
      );
    }

    const slot = await ParkingSlot.create(data);

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'create',
      resource: 'parking_slot',
      resourceId: slot._id,
      details: { slotCode: data.slotCode, buildingName: data.buildingName },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json(
      { success: true, data: slot },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating parking slot:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create parking slot' },
      { status: 500 }
    );
  }
}
