import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Vehicle, AuditLog } from '@/models';
import { requirePermission } from '@/lib/rbac';
import { createVehicleSchema } from '@/lib/validations';

// GET /api/resident/vehicles - Get own vehicles
export async function GET() {
  const { error, session } = await requirePermission('vehicles:read_own');
  if (error) return error;

  try {
    await connectDB();

    const vehicles = await Vehicle.find({
      ownerId: session!.user.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: vehicles });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

// POST /api/resident/vehicles - Register own vehicle
export async function POST(request: NextRequest) {
  const { error, session } = await requirePermission('vehicles:create_own');
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
      ownerId: session!.user.id,
      createdBy: session!.user.id,
    });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'create',
      resource: 'vehicle',
      resourceId: vehicle._id,
      details: { plateNumber: data.plateNumber, selfRegistered: true },
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
