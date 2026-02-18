# API Overview

API routes live under `src/app/api/*`.

## Auth
- NextAuth handler: [auth/[...nextauth]/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/auth/%5B...nextauth%5D/route.ts)

## Parking
- List/Create: [parking/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/parking/route.ts)
- Update/Delete: [parking/[id]/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/parking/%5Bid%5D/route.ts)
- Exit vehicle: [parking/[id]/exit/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/parking/%5Bid%5D/exit/route.ts)

## Vehicles
- List/Create: [vehicles/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/vehicles/route.ts)
- Read/Update/Delete: [vehicles/[id]/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/vehicles/%5Bid%5D/route.ts)
- Resident-owned vehicles: [resident/vehicles/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/resident/vehicles/route.ts)

## Residents
- Search residents: [residents/search/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/residents/search/route.ts)
- Resident parking history: [resident/history/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/resident/history/route.ts)

## Buildings & Parking Slots
- Public buildings list: [buildings/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/buildings/route.ts)
- Admin buildings: [admin/buildings/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/admin/buildings/route.ts), [admin/buildings/[id]/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/admin/buildings/%5Bid%5D/route.ts)
- Admin parking slots: [admin/parking-slots/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/admin/parking-slots/route.ts), [admin/parking-slots/[id]/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/admin/parking-slots/%5Bid%5D/route.ts)
- Public parking slots: [parking-slots/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/parking-slots/route.ts)

## Admin Users
- Admin users list/CRUD: [admin/users/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/admin/users/route.ts), [admin/users/[id]/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/admin/users/%5Bid%5D/route.ts)

## Reports
- Parking reports export: [reports/parking/route.ts](file:///Users/bluestella/repositories/rochester-parking/src/app/api/reports/parking/route.ts)

## Access Control
- See RBAC rules in [rbac.md](file:///Users/bluestella/repositories/rochester-parking/.docs/rbac.md) and middleware enforcement in [middleware.ts](file:///Users/bluestella/repositories/rochester-parking/src/middleware.ts).
