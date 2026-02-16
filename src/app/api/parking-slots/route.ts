import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ParkingSlot } from '@/models';
import { requireAuth, requireRole } from '@/lib/rbac';
import { createParkingSlotSchema } from '@/lib/validations';

// GET /api/parking-slots - Get all parking slots
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const buildingName = searchParams.get('buildingName');
    const available = searchParams.get('available');

    const query: Record<string, unknown> = {};

    if (buildingName) {
      query.buildingName = buildingName;
    }

    if (available === 'true') {
      query.isOccupied = false;
    } else if (available === 'false') {
      query.isOccupied = true;
    }

    const slots = await ParkingSlot.find(query)
      .sort({ slotCode: 1 })
      .lean();

    // Group by building for easier frontend use
    const slotsByBuilding = slots.reduce(
      (acc, slot) => {
        if (!acc[slot.buildingName]) {
          acc[slot.buildingName] = [];
        }
        acc[slot.buildingName].push(slot);
        return acc;
      },
      {} as Record<string, typeof slots>
    );

    return NextResponse.json({
      success: true,
      data: {
        slots,
        slotsByBuilding,
        totalSlots: slots.length,
        availableSlots: slots.filter((s) => !s.isOccupied).length,
        occupiedSlots: slots.filter((s) => s.isOccupied).length,
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

// POST /api/parking-slots - Create parking slot (Admin only)
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
