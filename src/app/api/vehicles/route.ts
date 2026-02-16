import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Vehicle, AuditLog } from '@/models';
import { requirePermission } from '@/lib/rbac';
import { createVehicleSchema, paginationSchema } from '@/lib/validations';

// GET /api/vehicles - Get all vehicles (Admin/Guard)
export async function GET(request: NextRequest) {
  const { error, session } = await requirePermission('vehicles:read');
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
    const buildingName = searchParams.get('buildingName');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build query
    const query: Record<string, unknown> = {};

    if (buildingName) {
      query.buildingName = buildingName;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active vehicles
    }

    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { buildingName: { $regex: search, $options: 'i' } },
        { unitNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'name email unitNumber buildingName')
        .populate('createdBy', 'name email')
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Create vehicle (Admin/Guard for any owner)
export async function POST(request: NextRequest) {
  const { error, session } = await requirePermission('vehicles:create');
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = createVehicleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if plate number already exists
    const existingVehicle = await Vehicle.findOne({
      plateNumber: data.plateNumber,
    });
    if (existingVehicle) {
      return NextResponse.json(
        { success: false, error: 'Plate number already registered' },
        { status: 400 }
      );
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      ...data,
      createdBy: session!.user.id,
    });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'create',
      resource: 'vehicle',
      resourceId: vehicle._id,
      details: { plateNumber: data.plateNumber },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json(
      { success: true, data: vehicle },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating vehicle:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}
