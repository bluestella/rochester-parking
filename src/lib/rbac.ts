import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';

export {
  ROLES,
  STAFF_ROLES,
  PRIVILEGED_ROLES,
  ROLE_LABELS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canManageRole,
  assignableRoles,
  permissionsFor,
  isRole,
} from './permissions';
export type { Role, Permission } from './permissions';
import { hasPermission, hasAnyPermission, type Permission, type Role } from './permissions';

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

export async function requirePermission(permission: Permission | Permission[]) {
  const { error, session } = await requireAuth();

  if (error) {
    return { error, session: null };
  }

  const userRole = session!.user.role as Role;
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(userRole, permission)
    : hasPermission(userRole, permission);

  if (!allowed) {
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
