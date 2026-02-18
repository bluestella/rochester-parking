# RBAC Reference

## Roles
- Admin
- Guard
- Resident

## Middleware Guards
- Pages and API routes are protected via [middleware.ts](file:///Users/bluestella/repositories/rochester-parking/src/middleware.ts).
- Page access:
  - `/admin` → Admin
  - `/parking` → Admin, Guard
  - `/resident` → Admin, Resident
  - `/dashboard` → Admin, Guard, Resident
- API access:
  - `/api/admin/*` → Admin
  - `/api/parking/*` → Admin, Guard
  - `/api/vehicles/*` → Admin, Guard
  - `/api/resident/*` → Admin, Resident

## Permission Matrix
- Implemented in [rbac.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/rbac.ts).

- Admin:
  - parking:create/read/read_own/update/delete/exit
  - users:create/read/update/delete
  - vehicles:create/read/update/delete
  - buildings:create/read/update/delete
  - parking_slots:create/read/update/delete
  - reports:export/reports:export_own

- Guard:
  - parking:create/read/update/exit
  - vehicles:create/read/update

- Resident:
  - parking:read_own
  - vehicles:create_own/read_own
  - reports:export_own

## Helpers
- `requireAuth`, `requireRole`, `requirePermission` and access utilities are provided in [rbac.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/rbac.ts).
