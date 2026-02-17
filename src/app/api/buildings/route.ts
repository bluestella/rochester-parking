import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Building } from '@/models';
import { requireAuth } from '@/lib/rbac';

// GET /api/buildings - Get all active buildings (for dropdowns)
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    const buildings = await Building.find({ isActive: true })
      .sort({ name: 1 })
      .select('_id name code address floors')
      .lean();

    return NextResponse.json({
      success: true,
      data: buildings,
    });
  } catch (err) {
    console.error('Error fetching buildings:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}
