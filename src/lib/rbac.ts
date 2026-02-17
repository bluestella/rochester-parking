import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

export type Role = 'admin' | 'guard' | 'resident';

export type Permission =
  | 'parking:create'
  | 'parking:read'
  | 'parking:read_own'
  | 'parking:update'
  | 'parking:delete'
  | 'parking:exit'
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'vehicles:create'
  | 'vehicles:create_own'
  | 'vehicles:read'
  | 'vehicles:read_own'
  | 'vehicles:update'
  | 'vehicles:delete'
  | 'buildings:create'
  | 'buildings:read'
  | 'buildings:update'
  | 'buildings:delete'
  | 'parking_slots:create'
  | 'parking_slots:read'
  | 'parking_slots:update'
  | 'parking_slots:delete'
  | 'reports:export'
  | 'reports:export_own';

// Permission matrix
const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'parking:create',
    'parking:read',
    'parking:read_own',
    'parking:update',
    'parking:delete',
    'parking:exit',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'vehicles:create',
    'vehicles:read',
    'vehicles:update',
    'vehicles:delete',
    'buildings:create',
    'buildings:read',
    'buildings:update',
    'buildings:delete',
    'parking_slots:create',
    'parking_slots:read',
    'parking_slots:update',
    'parking_slots:delete',
    'reports:export',
    'reports:export_own',
  ],
  guard: [
    'parking:create',
    'parking:read',
    'parking:update',
    'parking:exit',
    'vehicles:create',
    'vehicles:read',
    'vehicles:update',
  ],
  resident: [
    'parking:read_own',
    'vehicles:create_own',
    'vehicles:read_own',
    'reports:export_own',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

// Route protection helper
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

export async function requireRole(allowedRoles: Role[]) {
  const { error, session } = await requireAuth();

  if (error) {
    return { error, session: null };
  }

  const userRole = session!.user.role as Role;

  if (!allowedRoles.includes(userRole)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

export async function requirePermission(permission: Permission) {
  const { error, session } = await requireAuth();

  if (error) {
    return { error, session: null };
  }

  const userRole = session!.user.role as Role;

  if (!hasPermission(userRole, permission)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

// Utility to check if user can access a resource
export function canAccessResource(
  userRole: Role,
  userId: string,
  resourceOwnerId?: string,
  readAllPermission?: Permission,
  readOwnPermission?: Permission
): boolean {
  // Admin can access everything
  if (userRole === 'admin') return true;

  // Check read all permission
  if (readAllPermission && hasPermission(userRole, readAllPermission)) {
    return true;
  }

  // Check read own permission
  if (readOwnPermission && hasPermission(userRole, readOwnPermission)) {
    return resourceOwnerId === userId;
  }

  return false;
}
