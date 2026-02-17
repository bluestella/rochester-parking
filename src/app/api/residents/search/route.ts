import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Vehicle } from '@/models';
import { requirePermission } from '@/lib/rbac';

// GET /api/residents/search - Search residents with their vehicles
export async function GET(request: NextRequest) {
  const { error } = await requirePermission('parking:create');
  if (error) return error;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    if (search.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Find residents matching the search term
    const residents = await User.find({
      role: 'resident',
      isActive: true,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { unitNumber: { $regex: search, $options: 'i' } },
      ],
    })
      .select('_id name email unitNumber buildingName')
      .limit(10)
      .lean();

    // Get vehicles for each resident
    const residentIds = residents.map((r) => r._id);
    const vehicles = await Vehicle.find({
      ownerId: { $in: residentIds },
      isActive: true,
    })
      .select('_id plateNumber buildingName unitNumber make vehicleModel color ownerId')
      .lean();

    // Group vehicles by owner
    const vehiclesByOwner = vehicles.reduce(
      (acc, vehicle) => {
        const ownerId = vehicle.ownerId?.toString();
        if (ownerId) {
          if (!acc[ownerId]) {
            acc[ownerId] = [];
          }
          acc[ownerId].push(vehicle);
        }
        return acc;
      },
      {} as Record<string, typeof vehicles>
    );

    // Combine residents with their vehicles
    const results = residents.map((resident) => ({
      ...resident,
      vehicles: vehiclesByOwner[resident._id.toString()] || [],
    }));

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('Error searching residents:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to search residents' },
      { status: 500 }
    );
  }
}
