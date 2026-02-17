import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { User, AuditLog } from '@/models';
import { requireRole } from '@/lib/rbac';
import { updateUserSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await User.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    console.error('Error fetching user:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if changing email to one that already exists
    if (data.email && data.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: data.email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
      delete updateData.password;
    }

    // Lowercase email if provided
    if (data.email) {
      updateData.email = data.email.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'update',
      resource: 'user',
      resourceId: user._id,
      details: { changes: Object.keys(data) },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Soft delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole(['admin']);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (id === session!.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive
    await User.findByIdAndUpdate(id, { isActive: false });

    // Create audit log
    await AuditLog.create({
      userId: session!.user.id,
      action: 'delete',
      resource: 'user',
      resourceId: user._id,
      details: { email: user.email },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
