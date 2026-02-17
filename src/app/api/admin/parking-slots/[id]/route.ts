import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { ParkingSlot, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { updateParkingSlotSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/parking-slots/[id] - Get single parking slot
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parking slot ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const slot = await ParkingSlot.findById(id).lean();

    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Parking slot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: slot });
  } catch (err) {
    console.error('Error fetching parking slot:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parking slot' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/parking-slots/[id] - Update parking slot
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parking slot ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();
    const validationResult = updateParkingSlotSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if slot exists
    const existingSlot = await ParkingSlot.findById(id);
    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Parking slot not found' },
        { status: 404 }
      );
    }

    // Check if slotCode is being changed and if it already exists
    if (data.slotCode && data.slotCode !== existingSlot.slotCode) {
      const codeExists = await ParkingSlot.findOne({ slotCode: data.slotCode, _id: { $ne: id } });
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Slot code already exists' },
          { status: 400 }
        );
      }
    }

    const slot = await ParkingSlot.findByIdAndUpdate(id, data, { new: true });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'update',
      resource: 'parking_slot',
      resourceId: slot!._id,
      details: { changes: data },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, data: slot });
  } catch (err) {
    console.error('Error updating parking slot:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update parking slot' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/parking-slots/[id] - Delete parking slot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid parking slot ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Parking slot not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of occupied slots
    if (slot.isOccupied) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete an occupied parking slot' },
        { status: 400 }
      );
    }

    await ParkingSlot.findByIdAndDelete(id);

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'delete',
      resource: 'parking_slot',
      resourceId: slot._id,
      details: { slotCode: slot.slotCode },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Parking slot deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting parking slot:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete parking slot' },
      { status: 500 }
    );
  }
}
