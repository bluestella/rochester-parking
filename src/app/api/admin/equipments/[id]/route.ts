import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Equipment, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { updateEquipmentSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/equipments/[id] - Get single equipment
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const equipment = await Equipment.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: equipment });
  } catch (err) {
    console.error('Error fetching equipment:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/equipments/[id] - Update equipment
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();
    const validationResult = updateEquipmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if equipment exists
    const existingEquipment = await Equipment.findById(id);
    if (!existingEquipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Check if equipment ID is being changed and if it already exists
    if (data.equipmentId && data.equipmentId !== existingEquipment.equipmentId) {
      const idExists = await Equipment.findOne({ equipmentId: data.equipmentId, _id: { $ne: id } });
      if (idExists) {
        return NextResponse.json(
          { success: false, error: 'Equipment ID already exists' },
          { status: 400 }
        );
      }
    }

    const equipment = await Equipment.findByIdAndUpdate(id, data, { new: true });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'update',
      resource: 'equipment',
      resourceId: equipment!._id,
      details: { changes: data },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, data: equipment });
  } catch (err) {
    console.error('Error updating equipment:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/equipments/[id] - Delete equipment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    await Equipment.findByIdAndDelete(id);

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'delete',
      resource: 'equipment',
      resourceId: equipment._id,
      details: { equipmentId: equipment.equipmentId },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Equipment deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete equipment' },
      { status: 500 }
    );
  }
}
