import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { User, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { createUserSchema, paginationSchema } from '@/lib/validations';

// GET /api/admin/users - Get all users
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
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build query
    const query: Record<string, unknown> = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      unitNumber: data.unitNumber,
      buildingName: data.buildingName,
      createdBy: session!.user.id,
    });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'create',
      resource: 'user',
      resourceId: user._id,
      details: { email: data.email, role: data.role },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userObj = user.toObject() as Record<string, any>;
    delete userObj.passwordHash;

    return NextResponse.json(
      { success: true, data: userObj },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
