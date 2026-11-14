/**
 * Roles and the permission matrix.
 *
 * This file has no imports on purpose: it is shared by the edge middleware,
 * server route handlers and client components (navigation, buttons).
 * Server-only helpers (session checks) live in `rbac.ts`.
 */

export const ROLES = [
  'super_admin',
  'admin',
  'accountant',
  'maintenance',
  'guard',
  'resident',
] as const;

export type Role = (typeof ROLES)[number];

/** Roles that work for the property (everyone except residents). */
export const STAFF_ROLES: Role[] = ['super_admin', 'admin', 'accountant', 'maintenance', 'guard'];

/** Office roles: only a super admin may create, edit or deactivate these accounts. */
export const PRIVILEGED_ROLES: Role[] = ['super_admin', 'admin', 'accountant', 'maintenance'];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  accountant: 'Accountant',
  maintenance: 'Maintenance',
  guard: 'Guard',
  resident: 'Resident',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Full access, including staff accounts, billing settings, deletions and the activity log.',
  admin: 'Day-to-day property administration: residents, units, parking, amenities, requests and notices. Billing is view-only.',
  accountant: 'Dues and billing: statements, payments, late charges, rates and finance exports.',
  maintenance: 'Service requests and equipment upkeep.',
  guard: 'Gate log, deck map and visitor check-in.',
  resident: 'Their own dues, bookings, requests, visitors and parking history.',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export type Permission =
  // Home
  | 'dashboard:view'
  | 'resident_portal:access'
  // Gate and parking
  | 'parking:create'
  | 'parking:read'
  | 'parking:read_own'
  | 'parking:update'
  | 'parking:delete'
  | 'parking:exit'
  | 'visitors:manage'
  | 'visitors:manage_own'
  | 'vehicles:create'
  | 'vehicles:create_own'
  | 'vehicles:read'
  | 'vehicles:read_own'
  | 'vehicles:update'
  | 'vehicles:delete'
  | 'parking_slots:create'
  | 'parking_slots:read'
  | 'parking_slots:update'
  | 'parking_slots:delete'
  | 'reports:export'
  | 'reports:export_own'
  // People
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'staff:manage'
  // Property
  | 'buildings:create'
  | 'buildings:read'
  | 'buildings:update'
  | 'buildings:delete'
  | 'units:read'
  | 'units:manage'
  | 'units:delete'
  | 'announcements:manage'
  // Facilities
  | 'amenities:read'
  | 'amenities:manage'
  | 'bookings:manage'
  | 'bookings:own'
  | 'requests:read_all'
  | 'requests:triage'
  | 'equipment:read'
  | 'equipment:manage'
  // Finance
  | 'billing:read'
  | 'billing:read_own'
  | 'billing:manage'
  | 'billing:settings'
  | 'billing:export'
  // System
  | 'audit:read'
  | 'system:design';

const ALL: Permission[] = [
  'dashboard:view', 'resident_portal:access',
  'parking:create', 'parking:read', 'parking:read_own', 'parking:update', 'parking:delete', 'parking:exit',
  'visitors:manage', 'visitors:manage_own',
  'vehicles:create', 'vehicles:create_own', 'vehicles:read', 'vehicles:read_own', 'vehicles:update', 'vehicles:delete',
  'parking_slots:create', 'parking_slots:read', 'parking_slots:update', 'parking_slots:delete',
  'reports:export', 'reports:export_own',
  'users:create', 'users:read', 'users:update', 'users:delete', 'staff:manage',
  'buildings:create', 'buildings:read', 'buildings:update', 'buildings:delete',
  'units:read', 'units:manage', 'units:delete', 'announcements:manage',
  'amenities:read', 'amenities:manage', 'bookings:manage', 'bookings:own',
  'requests:read_all', 'requests:triage', 'equipment:read', 'equipment:manage',
  'billing:read', 'billing:read_own', 'billing:manage', 'billing:settings', 'billing:export',
  'audit:read', 'system:design',
];

// Permission matrix
const rolePermissions: Record<Role, Permission[]> = {
  super_admin: ALL,

  // Property administration. No finance changes, no staff accounts,
  // no hard deletes of property records, no activity log.
  admin: [
    'dashboard:view',
    'resident_portal:access',
    'parking:create', 'parking:read', 'parking:update', 'parking:exit',
    'visitors:manage',
    'vehicles:create', 'vehicles:read', 'vehicles:update', 'vehicles:delete',
    'parking_slots:create', 'parking_slots:read', 'parking_slots:update',
    'reports:export',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'buildings:create', 'buildings:read', 'buildings:update',
    'units:read', 'units:manage',
    'announcements:manage',
    'amenities:read', 'amenities:manage', 'bookings:manage',
    'requests:read_all', 'requests:triage',
    'equipment:read',
    'billing:read',
  ],

  accountant: [
    'dashboard:view',
    'users:read',
    'buildings:read',
    'units:read',
    'parking_slots:read',
    'billing:read', 'billing:manage', 'billing:settings', 'billing:export',
  ],

  maintenance: [
    'dashboard:view',
    'buildings:read',
    'amenities:read',
    'requests:read_all', 'requests:triage',
    'equipment:read', 'equipment:manage',
  ],

  guard: [
    'parking:create', 'parking:read', 'parking:update', 'parking:exit',
    'visitors:manage',
    'vehicles:create', 'vehicles:read', 'vehicles:update',
  ],

  resident: [
    'resident_portal:access',
    'parking:read_own',
    'visitors:manage_own',
    'vehicles:create_own', 'vehicles:read_own',
    'reports:export_own',
    'amenities:read', 'bookings:own',
    'billing:read_own',
  ],
};

export function permissionsFor(role: string): Permission[] {
  return isRole(role) ? rolePermissions[role] : [];
}

export function hasPermission(role: string, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/** Whether `actor` may create, edit or deactivate an account with role `target`. */
export function canManageRole(actor: string, target: string): boolean {
  if (!hasPermission(actor, 'users:update') && !hasPermission(actor, 'users:create')) return false;
  if (PRIVILEGED_ROLES.includes(target as Role)) return hasPermission(actor, 'staff:manage');
  return true;
}

/** Roles `actor` may assign when creating or editing an account. */
export function assignableRoles(actor: string): Role[] {
  return ROLES.filter((r) => canManageRole(actor, r));
}

/** Where each role lands after signing in. */
export function homeFor(role: string): string {
  if (hasPermission(role, 'dashboard:view')) return '/dashboard';
  if (hasPermission(role, 'parking:read')) return '/parking';
  if (hasPermission(role, 'resident_portal:access')) return '/resident';
  return '/login';
}

/**
 * Page sections and the permission(s) needed to open them (any of).
 * The longest matching prefix wins, so `/admin/billing` overrides `/admin`.
 */
export const PAGE_ACCESS: Record<string, Permission[]> = {
  '/dashboard': ['dashboard:view'],
  '/parking': ['parking:read'],
  '/parking/visitors': ['visitors:manage'],
  '/resident': ['resident_portal:access'],
  '/admin': ['system:design'], // anything under /admin not listed below: super admin only
  '/admin/users': ['users:update'],
  '/admin/units': ['units:read'],
  '/admin/buildings': ['buildings:update'],
  '/admin/vehicles': ['vehicles:read'],
  '/admin/parking-slots': ['parking_slots:read'],
  '/admin/billing': ['billing:read'],
  '/admin/amenities': ['amenities:manage', 'bookings:manage'],
  '/admin/requests': ['requests:read_all'],
  '/admin/equipments': ['equipment:read'],
  '/admin/announcements': ['announcements:manage'],
  '/admin/logs': ['audit:read'],
  '/admin/design-system': ['system:design'],
};

/** Page sections that are for office staff only, on top of the permission above. */
export const OFFICE_SECTIONS = ['/admin', '/dashboard'];

/** Whether `role` may open the page at `pathname`. */
export function canOpenPage(role: string, pathname: string): boolean {
  const needed = accessFor(pathname, PAGE_ACCESS);
  if (!needed) return true;
  if (OFFICE_SECTIONS.some((s) => inSection(pathname, s)) && !hasPermission(role, 'dashboard:view')) {
    return false;
  }
  return hasAnyPermission(role, needed);
}

/** Coarse API guard used by middleware. Every handler also checks its own permission. */
export const API_ACCESS: Record<string, Permission[]> = {
  '/api/admin/users': ['users:read'],
  '/api/admin/buildings': ['buildings:read'],
  '/api/admin/parking-slots': ['parking_slots:read'],
  '/api/admin/equipments': ['equipment:read'],
  '/api/admin/logs': ['audit:read'],
  '/api/admin': ['system:design'],
  '/api/parking': ['parking:read'],
  '/api/vehicles': ['vehicles:read'],
  '/api/resident': ['resident_portal:access'],
  '/api/residents': ['parking:create'],
  '/api/reports': ['reports:export'],
  '/api/billing': ['billing:read', 'billing:read_own'],
  '/api/bookings': ['bookings:manage', 'bookings:own'],
  '/api/visitors': ['visitors:manage', 'visitors:manage_own'],
  '/api/units': ['units:read', 'resident_portal:access'],
};

function inSection(pathname: string, section: string) {
  return pathname === section || pathname.startsWith(section + '/');
}

/** The permissions guarding `pathname`, from the longest matching section, or null if unguarded. */
export function accessFor(pathname: string, table: Record<string, Permission[]>): Permission[] | null {
  let best: string | null = null;
  for (const section of Object.keys(table)) {
    if (inSection(pathname, section) && (!best || section.length > best.length)) best = section;
  }
  return best ? table[best] : null;
}
