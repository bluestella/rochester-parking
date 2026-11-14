import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { like } from '@/lib/api';
import { ParkingRecord, ParkingSlot, Vehicle, AuditLog } from '@/models';
import { requirePermission } from '@/lib/rbac';
import {
  createParkingRecordSchema,
  parkingRecordQuerySchema,
} from '@/lib/validations';

// GET /api/parking - Get all parking records with filters
export async function GET(request: NextRequest) {
  const { error } = await requirePermission('parking:read');
  if (error) return error;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const queryResult = parkingRecordQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      buildingName: searchParams.get('buildingName') || undefined,
      plateNumber: searchParams.get('plateNumber') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, status, buildingName, plateNumber, startDate, endDate, search } =
      queryResult.data;

    // Build query
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (buildingName) {
      query.buildingName = buildingName;
    }

    if (plateNumber) {
      query.plateNumber = like(plateNumber);
    }

    if (search) {
      query.$or = [
        { plateNumber: like(search) },
        { buildingName: like(search) },
        { unitNumber: like(search) },
        { parkingSlot: like(search) },
      ];
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

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      ParkingRecord.find(query)
        .sort({ entryTimestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('residentId', 'name email unitNumber buildingName')
        .lean(),
      ParkingRecord.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching parking records:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch parking records' },
      { status: 500 }
    );
  }
}

// POST /api/parking - Create new parking record
export async function POST(request: NextRequest) {
  const { error, session } = await requirePermission('parking:create');
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = createParkingRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if vehicle is already parked
    const existingRecord = await ParkingRecord.findOne({
      plateNumber: data.plateNumber,
      status: 'parked',
    });

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Vehicle is already parked' },
        { status: 400 }
      );
    }

    // Claim the slot atomically so two guards cannot assign it at the same moment
    const slotExists = await ParkingSlot.exists({ slotCode: data.parkingSlot });
    const slot = await ParkingSlot.findOneAndUpdate(
      { slotCode: data.parkingSlot, isOccupied: false },
      { isOccupied: true, currentVehicle: data.plateNumber },
      { returnDocument: 'after' }
    );
    if (slotExists && !slot) {
      return NextResponse.json(
        { success: false, error: 'Parking slot is already occupied' },
        { status: 400 }
      );
    }

    // Try to find the vehicle to link
    const vehicle = await Vehicle.findOne({ plateNumber: data.plateNumber, isActive: true });

    let record;
    try {
      record = await ParkingRecord.create({
        ...data,
        entryTimestamp: data.entryTimestamp ? new Date(data.entryTimestamp) : new Date(),
        status: 'parked',
        vehicleId: vehicle?._id,
        residentId: vehicle?.ownerId,
        createdBy: session!.user.id,
      });
    } catch (createErr) {
      // Release the slot if the record could not be written
      if (slot) {
        await ParkingSlot.findByIdAndUpdate(slot._id, { isOccupied: false, currentVehicle: null });
      }
      if ((createErr as { code?: number }).code === 11000) {
        return NextResponse.json(
          { success: false, error: 'Vehicle is already parked' },
          { status: 400 }
        );
      }
      throw createErr;
    }

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'create',
      resource: 'parking_record',
      resourceId: record._id,
      details: { plateNumber: data.plateNumber, parkingSlot: data.parkingSlot },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json(
      { success: true, data: record },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating parking record:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create parking record' },
      { status: 500 }
    );
  }
}
