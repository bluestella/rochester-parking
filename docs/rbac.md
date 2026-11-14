# RBAC Reference

All roles and permissions live in one place: [`src/lib/permissions.ts`](../src/lib/permissions.ts).
It has no imports, so the edge middleware, API handlers and client components share the same matrix.
`src/lib/rbac.ts` re-exports it and adds the server-side session helpers.

## Roles

| Role | Purpose | Lands on |
|------|---------|----------|
| `super_admin` | Full access, including office accounts, billing settings, hard deletes, activity log, design system | `/dashboard` |
| `admin` | Day-to-day property administration. Billing and equipment are view-only. Cannot manage office accounts or hard-delete property records | `/dashboard` |
| `accountant` | Dues and billing: statements, payments, late charges, rates, exports | `/dashboard` |
| `maintenance` | Service requests and equipment upkeep | `/dashboard` |
| `guard` | Gate log, deck map, visitor check-in | `/parking` |
| `resident` | Own dues, bookings, requests, visitors, parking history | `/resident` |

## What each office role can do

| Area | Super admin | Admin | Accountant | Maintenance |
|------|:-:|:-:|:-:|:-:|
| Overview dashboard | ✓ | ✓ | ✓ (finance) | ✓ (requests, equipment) |
| Gate log, deck map, visitors | ✓ | ✓ | – | – |
| Edit parking records | ✓ | ✓ | – | – |
| Delete parking records | ✓ | – | – | – |
| Vehicles | ✓ | ✓ | – | – |
| Parking slots | ✓ | create / edit | view | – |
| Buildings | ✓ | create / edit | view (API only) | view (API only) |
| Units | ✓ | create / edit | view | – |
| Retire units | ✓ | – | – | – |
| Residents and guards | ✓ | ✓ | view (API only) | – |
| Office accounts (super admin, admin, accountant, maintenance) | ✓ | – | – | – |
| Announcements | ✓ | ✓ | – | – |
| Amenities and bookings | ✓ | ✓ | – | – |
| Service requests (all, triage) | ✓ | ✓ | – | ✓ |
| Equipment | ✓ | view | – | ✓ |
| Billing: view statements, payments, receivables | ✓ | ✓ | ✓ | – |
| Billing: issue, record, confirm, late charges, void | ✓ | – | ✓ | – |
| Billing: rates and settings | ✓ | – | ✓ | – |
| Billing: CSV export | ✓ | – | ✓ | – |
| Parking report export | ✓ | ✓ | – | – |
| Activity log | ✓ | – | – | – |
| Design system page | ✓ | – | – | – |

Anyone signed in can file a service request; non-triage roles only see their own.

## Enforcement layers

1. **Middleware** (`src/middleware.ts`) — `PAGE_ACCESS` and `API_ACCESS` map path prefixes to the
   permissions needed (longest prefix wins). `/admin/*` and `/dashboard` also require `dashboard:view`,
   so guards and residents cannot open office pages. Any `/admin` page not listed is super-admin only.
2. **API handlers** — every handler checks its own permission, via `route({ permission })` in
   `src/lib/api.ts` (a list means "any of") or `requirePermission()` in `src/lib/rbac.ts`. Handlers
   use `ctx.can(permission)` for scoped behaviour (e.g. residents only see their own invoices).
3. **Account management** — `canManageRole(actor, target)` stops anyone without `staff:manage`
   from creating, editing, promoting into, or deactivating an office account. Users cannot change
   their own role or deactivate themselves.
4. **UI** — `useCan()` (`src/hooks/useCan.ts`) hides actions a role cannot take; `navFor(role)`
   shows only the pages a role can open. This is convenience only — the API is the source of truth.

## Adding a permission

1. Add it to the `Permission` union and `ALL` in `permissions.ts`, and to each role that should hold it.
2. Guard the handler with `route({ permission: '...' })` or `requirePermission('...')`.
3. If it gates a page, add the path to `PAGE_ACCESS` and the nav item's `needs`.
