import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { ParkingRecord, ParkingSlot, AuditLog } from '@/models';
import { requirePermission } from '@/lib/rbac';
import { exitParkingRecordSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/parking/[id]/exit - Mark vehicle as exited
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission('parking:exit');
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

    const body = await request.json().catch(() => ({}));
    const validationResult = exitParkingRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
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

    if (record.status === 'exited') {
      return NextResponse.json(
        { success: false, error: 'Vehicle has already exited' },
        { status: 400 }
      );
    }

    const exitTimestamp = validationResult.data.exitTimestamp
      ? new Date(validationResult.data.exitTimestamp)
      : new Date();

    // Calculate duration in minutes
    const entryTime = new Date(record.entryTimestamp).getTime();
    const exitTime = exitTimestamp.getTime();
    const durationMinutes = Math.round((exitTime - entryTime) / (1000 * 60));

    // Update record
    const updatedRecord = await ParkingRecord.findByIdAndUpdate(
      id,
      {
        status: 'exited',
        exitTimestamp,
        duration: durationMinutes,
        updatedBy: session!.user.id,
      },
      { new: true }
    );

    // Free up parking slot
    await ParkingSlot.findOneAndUpdate(
      { slotCode: record.parkingSlot },
      { isOccupied: false, currentVehicle: null }
    );

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'exit',
      resource: 'parking_record',
      resourceId: record._id,
      details: {
        plateNumber: record.plateNumber,
        duration: durationMinutes,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRecord?.toObject(),
        formattedDuration: formatDuration(durationMinutes),
      },
    });
  } catch (err) {
    console.error('Error processing vehicle exit:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process vehicle exit' },
      { status: 500 }
    );
  }
}

function formatDuration(minutes: number): string {
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
