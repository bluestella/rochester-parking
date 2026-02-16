import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { ParkingRecord, ParkingSlot, AuditLog } from '@/models';
import { requirePermission, requireRole } from '@/lib/rbac';
import { updateParkingRecordSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/parking/[id] - Get single parking record
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission('parking:read');
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID' },
        { status: 400 }
      );
    }

    const record = await ParkingRecord.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('residentId', 'name email unitNumber buildingName')
      .lean();

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    console.error('Error fetching parking record:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parking record' },
      { status: 500 }
    );
  }
}

// PUT /api/parking/[id] - Update parking record (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateParkingRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const record = await ParkingRecord.findById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    // If changing parking slot, update slot availability
    if (data.parkingSlot && data.parkingSlot !== record.parkingSlot) {
      // Free up old slot
      await ParkingSlot.findOneAndUpdate(
        { slotCode: record.parkingSlot },
        { isOccupied: false, currentVehicle: null }
      );

      // Check and occupy new slot
      const newSlot = await ParkingSlot.findOne({ slotCode: data.parkingSlot });
      if (newSlot?.isOccupied) {
        return NextResponse.json(
          { success: false, error: 'New parking slot is already occupied' },
          { status: 400 }
        );
      }

      if (newSlot) {
        await ParkingSlot.findByIdAndUpdate(newSlot._id, {
          isOccupied: true,
          currentVehicle: data.plateNumber || record.plateNumber,
        });
      }
    }

    const updatedRecord = await ParkingRecord.findByIdAndUpdate(
      id,
      {
        ...data,
        entryTimestamp: data.entryTimestamp
          ? new Date(data.entryTimestamp)
          : record.entryTimestamp,
        updatedBy: session!.user.id,
      },
      { new: true }
    );

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'update',
      resource: 'parking_record',
      resourceId: record._id,
      details: { changes: data },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (err) {
    console.error('Error updating parking record:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update parking record' },
      { status: 500 }
    );
  }
}

// DELETE /api/parking/[id] - Delete parking record (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID' },
        { status: 400 }
      );
    }

    const record = await ParkingRecord.findById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    // Free up parking slot if vehicle is still parked
    if (record.status === 'parked') {
      await ParkingSlot.findOneAndUpdate(
        { slotCode: record.parkingSlot },
        { isOccupied: false, currentVehicle: null }
      );
    }

    await ParkingRecord.findByIdAndDelete(id);

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'delete',
      resource: 'parking_record',
      resourceId: record._id,
      details: { plateNumber: record.plateNumber },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    console.error('Error deleting parking record:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete parking record' },
      { status: 500 }
    );
  }
}
