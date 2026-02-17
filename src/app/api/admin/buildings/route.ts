import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Building, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { createBuildingSchema, paginationSchema } from '@/lib/validations';

// GET /api/admin/buildings - Get all buildings (paginated)
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
    const isActive = searchParams.get('isActive');

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [buildings, total] = await Promise.all([
      Building.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      Building.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        buildings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching buildings:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/buildings - Create building
export async function POST(request: NextRequest) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = createBuildingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if building name already exists
    const existingName = await Building.findOne({ name: data.name });
    if (existingName) {
      return NextResponse.json(
        { success: false, error: 'Building name already exists' },
        { status: 400 }
      );
    }

    // Check if building code already exists
    const existingCode = await Building.findOne({ code: data.code });
    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'Building code already exists' },
        { status: 400 }
      );
    }

    const building = await Building.create({
      ...data,
      createdBy: session!.user.id,
    });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'create',
      resource: 'building',
      resourceId: building._id,
      details: { name: data.name, code: data.code },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json(
      { success: true, data: building },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating building:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create building' },
      { status: 500 }
    );
  }
}
