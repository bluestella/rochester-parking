'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission, type Permission } from '@/lib/permissions';

/**
 * `can(permission)` for the signed-in user. Use it to hide actions a role
 * may not take; the API enforces the same rules regardless.
 */
export function useCan() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? '';
  const can = useCallback((permission: Permission) => hasPermission(role, permission), [role]);
  return { can, role };
}
