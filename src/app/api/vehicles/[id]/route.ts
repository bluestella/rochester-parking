import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Vehicle, AuditLog } from '@/models';
import { requirePermission } from '@/lib/rbac';
import { updateVehicleSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/vehicles/[id] - Get single vehicle
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission('vehicles:read');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(id)
      .populate('ownerId', 'name email unitNumber buildingName')
      .populate('createdBy', 'name email')
      .lean();

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vehicle });
  } catch (err) {
    console.error('Error fetching vehicle:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

// PUT /api/vehicles/[id] - Update vehicle
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission('vehicles:update');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateVehicleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Check if changing plate number to one that already exists
    if (data.plateNumber && data.plateNumber !== vehicle.plateNumber) {
      const existingVehicle = await Vehicle.findOne({
        plateNumber: data.plateNumber,
      });
      if (existingVehicle) {
        return NextResponse.json(
          { success: false, error: 'Plate number already registered' },
          { status: 400 }
        );
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'update',
      resource: 'vehicle',
      resourceId: vehicle._id,
      details: { changes: data },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, data: updatedVehicle });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id] - Deactivate vehicle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission('vehicles:delete');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    await Vehicle.findByIdAndUpdate(id, { isActive: false });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'delete',
      resource: 'vehicle',
      resourceId: vehicle._id,
      details: { plateNumber: vehicle.plateNumber },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, message: 'Vehicle deactivated' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
