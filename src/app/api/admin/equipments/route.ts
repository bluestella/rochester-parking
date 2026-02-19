import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Equipment, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { createEquipmentSchema, paginationSchema } from '@/lib/validations';

// GET /api/admin/equipments - Get all equipment
export async function GET(request: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const queryResult = paginationSchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { page, limit } = queryResult.data;
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { equipmentId: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { equipmentModel: { $regex: search, $options: 'i' } },
        { operatorDetails: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [equipments, total] = await Promise.all([
      Equipment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Equipment.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        equipments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching equipments:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch equipments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/equipments - Create equipment
export async function POST(request: NextRequest) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = createEquipmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if equipment ID already exists
    const existingEquipment = await Equipment.findOne({ equipmentId: data.equipmentId });
    if (existingEquipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment ID already exists' },
        { status: 400 }
      );
    }

    const equipment = await Equipment.create({
      ...data,
      createdBy: session!.user.id,
    });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'create',
      resource: 'equipment',
      resourceId: equipment._id,
      details: { equipmentId: data.equipmentId, make: data.make, equipmentModel: data.equipmentModel },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json(
      { success: true, data: equipment },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating equipment:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create equipment' },
      { status: 500 }
    );
  }
}
