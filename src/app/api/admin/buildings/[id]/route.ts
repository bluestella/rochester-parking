import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Building, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { updateBuildingSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/buildings/[id] - Get single building
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid building ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const building = await Building.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!building) {
      return NextResponse.json(
        { success: false, error: 'Building not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: building });
  } catch (err) {
    console.error('Error fetching building:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch building' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/buildings/[id] - Update building
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid building ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();
    const validationResult = updateBuildingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if building exists
    const existingBuilding = await Building.findById(id);
    if (!existingBuilding) {
      return NextResponse.json(
        { success: false, error: 'Building not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it already exists
    if (data.name && data.name !== existingBuilding.name) {
      const nameExists = await Building.findOne({ name: data.name, _id: { $ne: id } });
      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'Building name already exists' },
          { status: 400 }
        );
      }
    }

    // Check if code is being changed and if it already exists
    if (data.code && data.code !== existingBuilding.code) {
      const codeExists = await Building.findOne({ code: data.code, _id: { $ne: id } });
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Building code already exists' },
          { status: 400 }
        );
      }
    }

    const building = await Building.findByIdAndUpdate(id, data, { new: true });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'update',
      resource: 'building',
      resourceId: building!._id,
      details: { changes: data },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, data: building });
  } catch (err) {
    console.error('Error updating building:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update building' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/buildings/[id] - Soft delete building
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid building ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const building = await Building.findById(id);
    if (!building) {
      return NextResponse.json(
        { success: false, error: 'Building not found' },
        { status: 404 }
      );
    }

    // Soft delete by marking as inactive
    await Building.findByIdAndUpdate(id, { isActive: false });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'delete',
      resource: 'building',
      resourceId: building._id,
      details: { name: building.name },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Building deactivated successfully',
    });
  } catch (err) {
    console.error('Error deleting building:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete building' },
      { status: 500 }
    );
  }
}
