# Claude Code Prompt: Condominium Parking Management System

## Role Definition

You are an expert full-stack software engineer specializing in Next.js, MongoDB, and enterprise-grade web applications. Your task is to build a **Condominium Parking Management System** — a responsive, production-ready web application that enables condominium staff and residents to record, monitor, and manage vehicle parking activity within the premises.

You will follow modern best practices for authentication, role-based access control (RBAC), RESTful API design, and responsive UI development throughout the implementation.

---

## Project Overview

**Application Name:** Condo ParkTrack  
**Tech Stack:**
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes (Node.js runtime)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js (JWT-based)
- **RBAC / Access Control:** Permit.io (open-source RBAC SDK)
- **Deployment Target:** Vercel (frontend + API), MongoDB Atlas (database)

---

## User Roles

Define three distinct user roles with specific access levels:

| Role | Description |
|---|---|
| **Admin** | Full system access — manages users, views all records, generates reports |
| **Guard** | Operational access — records car entry/exit, updates parking status |
| **Resident** | Self-service access — views their own vehicle's active and historical parking records |

---

## Key Responsibilities & Features

### 1. Parking Record Management (Guards & Admin)

Build a parking entry form and record system with the following fields:

- **Plate Number** — required, uppercase, validated format (e.g., `ABC 1234`)
- **Timestamp of Entry** — auto-populated with current date and time (editable if needed)
- **Building Name** — dropdown selection from predefined building list
- **Unit Number** — text input (e.g., `12B`, `305`)
- **Codename / Slot** — parking slot identifier (e.g., `P1-A12`, `Basement-B3`)
- **Vehicle Owner / Resident Reference** — optional link to a registered resident account

Implement a **Parking Records Table** with:
- Real-time search and filter (by plate number, building, status, date range)
- Pagination (10–25 records per page)
- Status badges: `Parked` (green), `Exited` (gray)
- Quick action buttons: "Mark as Exited", "Edit Record", "View Details"

### 2. Parking Exit / Status Update (Guards & Admin)

When a vehicle exits the condominium:

- Allow guards to search by plate number to find the active parking record
- Record the **Timestamp of Exit** automatically upon marking as exited
- Calculate and display the **Duration of Stay** (e.g., `2 hrs 45 mins`)
- Update the parking status from `Parked` → `Exited`
- Prevent duplicate active entries for the same plate number

### 3. Admin User Management Panel

Build a full **User Admin Page** with CRUD operations:

- **View Users** — paginated table showing all users (name, email, role, status, date created)
- **Add User** — form to create new accounts (name, email, password, role assignment)
- **Edit User** — update user details, change role, activate/deactivate account
- **Delete User** — soft delete with confirmation dialog (mark as inactive, do not permanently remove)
- **Role Assignment** — dropdown to assign `admin`, `guard`, or `resident` roles
- **Audit Trail** — log who created/modified/deleted each user and when

### 4. Resident Parking History Portal

Build a **Resident Dashboard** that allows residents to:

- View their **Active Parking Records** — currently parked vehicles linked to their unit
- View their **Historical Parking Records** — paginated list of all past entries with entry/exit timestamps and duration
- **Filter by date range**, plate number, or building
- Export parking history as **CSV** for personal records
- View a **Summary Card** showing: total visits this month, average stay duration, most used parking slot

### 5. RBAC with Permit.io

Integrate [Permit.io](https://www.permit.io/) for role-based access control:

- **Initialize Permit SDK** in the Next.js backend using `@permitio/permit-fe-sdk` or the Node.js SDK
- **Define Resources and Actions** in Permit.io:
  - Resource: `parking_record` → Actions: `create`, `read`, `update`, `delete`
  - Resource: `user` → Actions: `create`, `read`, `update`, `delete`
  - Resource: `parking_history` → Actions: `read_own`, `read_all`
- **Enforce permissions** in every API route using `permit.check(userId, action, resource)`
- **Role-Permission Matrix:**

  | Permission | Admin | Guard | Resident |
  |---|---|---|---|
  | Create parking record | ✅ | ✅ | ❌ |
  | Update parking status (exit) | ✅ | ✅ | ❌ |
  | View all parking records | ✅ | ✅ | ❌ |
  | View own parking records | ✅ | ❌ | ✅ |
  | Manage users (CRUD) | ✅ | ❌ | ❌ |
  | Export reports | ✅ | ❌ | ❌ |

---

## Implementation Approach

### Phase 1: Project Scaffolding & Configuration

```bash
npx create-next-app@latest condo-parktrack --typescript --tailwind --eslint --app
cd condo-parktrack
npm install mongoose next-auth @permitio/permit-node
npm install @radix-ui/react-dialog lucide-react clsx
npx shadcn-ui@latest init
```

1. Set up the folder structure:
   ```
   /app
     /api
       /auth/[...nextauth]/route.ts
       /parking/route.ts
       /parking/[id]/route.ts
       /users/route.ts
       /users/[id]/route.ts
     /(auth)
       /login/page.tsx
     /(dashboard)
       /admin/page.tsx
       /admin/users/page.tsx
       /guard/page.tsx
       /resident/page.tsx
   /components
     /parking/
     /users/
     /ui/
   /lib
     /mongodb.ts
     /permit.ts
     /auth.ts
   /models
     /User.ts
     /ParkingRecord.ts
   ```

2. Configure environment variables in `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://...
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=http://localhost:3000
   PERMIT_API_KEY=your_permitio_api_key
   PERMIT_PDP_URL=http://localhost:7766
   ```

### Phase 2: Database Models (MongoDB / Mongoose)

**User Model (`/models/User.ts`):**
```typescript
{
  name: String,
  email: String (unique, indexed),
  passwordHash: String,
  role: Enum['admin', 'guard', 'resident'],
  unitNumber: String (optional, for residents),
  buildingName: String (optional),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId (ref: User)
}
```

**ParkingRecord Model (`/models/ParkingRecord.ts`):**
```typescript
{
  plateNumber: String (required, indexed),
  entryTimestamp: Date (required),
  exitTimestamp: Date (nullable),
  buildingName: String (required),
  unitNumber: String (required),
  parkingSlot: String (required),  // codename
  status: Enum['parked', 'exited'],
  duration: Number (minutes, calculated on exit),
  residentId: ObjectId (ref: User, optional),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Phase 3: Authentication (NextAuth.js)

- Implement **credentials provider** for email/password login
- Store hashed passwords using `bcryptjs`
- Include `role` in the JWT session token
- Create a **middleware** (`middleware.ts`) to protect routes by role:
  - `/admin/*` → admin only
  - `/guard/*` → admin + guard
  - `/resident/*` → resident only

### Phase 4: Permit.io RBAC Integration

```typescript
// /lib/permit.ts
import { Permit } from 'permitio';

export const permit = new Permit({
  pdp: process.env.PERMIT_PDP_URL,
  token: process.env.PERMIT_API_KEY,
});

// Usage in API route
const permitted = await permit.check(userId, 'create', 'parking_record');
if (!permitted) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

- Sync users to Permit.io upon registration using `permit.api.syncUser()`
- Assign roles via `permit.api.assignRole()`
- Validate all sensitive actions server-side before executing database operations

### Phase 5: Frontend Pages & Components

Build the following pages with responsive design using Tailwind CSS and shadcn/ui:

1. **Login Page** (`/login`) — clean, centered form with email/password fields
2. **Guard Dashboard** (`/guard`) — quick entry form + active parking table + search bar
3. **Admin Dashboard** (`/admin`) — summary statistics cards + full records table + filters
4. **User Management Page** (`/admin/users`) — CRUD table with modal forms
5. **Resident Portal** (`/resident`) — tabbed view: "Currently Parked" + "History" + export button

Key UI components to build:
- `<ParkingForm />` — entry form with validation
- `<ParkingTable />` — sortable, filterable table with pagination
- `<StatusBadge />` — color-coded status indicator
- `<UserModal />` — add/edit user dialog
- `<ExitModal />` — confirm exit with timestamp preview
- `<ResidentHistoryTable />` — personal history with duration column

---

## API Routes Specification

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/parking` | Admin, Guard | Create new parking record |
| `GET` | `/api/parking` | Admin, Guard | Get all parking records (with filters) |
| `GET` | `/api/parking/active` | Admin, Guard | Get all currently parked vehicles |
| `PATCH` | `/api/parking/[id]/exit` | Admin, Guard | Mark vehicle as exited |
| `PUT` | `/api/parking/[id]` | Admin | Update a parking record |
| `DELETE` | `/api/parking/[id]` | Admin | Delete a parking record |
| `GET` | `/api/parking/resident/me` | Resident | Get own parking history |
| `GET` | `/api/users` | Admin | Get all users |
| `POST` | `/api/users` | Admin | Create a new user |
| `PUT` | `/api/users/[id]` | Admin | Update user details |
| `DELETE` | `/api/users/[id]` | Admin | Soft-delete a user |

---

## Additional Considerations

### Security
- Hash all passwords using `bcryptjs` before storing
- Validate all inputs server-side using `zod` schema validation
- Use HTTPS in production; set `secure` cookies for sessions
- Rate-limit authentication endpoints to prevent brute force attacks
- Never expose `passwordHash` in API responses

### Data Integrity
- Prevent duplicate active parking records for the same plate number using a unique compound index: `{ plateNumber: 1, status: 1 }` filtered on `status: 'parked'`
- Use MongoDB transactions for exit operations (update record + recalculate duration atomically)

### Performance
- Add MongoDB indexes on: `plateNumber`, `status`, `buildingName`, `entryTimestamp`, `residentId`
- Use cursor-based pagination for large datasets
- Cache frequently accessed data (e.g., building list, active slot list) using `unstable_cache` in Next.js

### Responsive Design
- Mobile-first layout — guards may use tablets or phones on-site
- Touch-friendly buttons (minimum 44px tap target)
- Collapsible sidebar navigation for small screens
- Stack table columns responsively or use card-based layout on mobile

### Audit & Logging
- Log all create/update/delete actions with: `userId`, `action`, `resourceId`, `timestamp`, `ipAddress`
- Store logs in a dedicated `AuditLog` MongoDB collection
- Make audit logs accessible to admins via the dashboard

### Error Handling
- Return consistent JSON error responses: `{ success: false, error: string, code: number }`
- Handle MongoDB connection failures gracefully with retry logic
- Show user-friendly error messages on the frontend with toast notifications

---

## Deliverables Checklist

- [ ] Next.js project with App Router and TypeScript configured
- [ ] MongoDB connection with Mongoose models (User, ParkingRecord)
- [ ] NextAuth.js authentication with role-based JWT sessions
- [ ] Permit.io RBAC integration with enforced permissions on all API routes
- [ ] Guard Dashboard — parking entry form and active records table
- [ ] Admin Dashboard — full records table with stats overview
- [ ] Admin User Management — CRUD interface with role assignment
- [ ] Resident Portal — personal parking history with export
- [ ] Parking exit flow — search by plate, confirm exit, record timestamp
- [ ] Responsive UI across mobile, tablet, and desktop
- [ ] Input validation using Zod on all forms and API routes
- [ ] Soft-delete for users; permanent delete option for admins on records
- [ ] README.md with setup, environment variable guide, and deployment instructions

---

> **Note to Claude Code:** Start with Phase 1 (scaffolding), then proceed phase by phase. After each phase, confirm the structure before moving forward. Ask for clarification on any business rule ambiguity (e.g., whether residents can register their own vehicles, whether multiple vehicles per unit are allowed, or whether parking slots are pre-defined or free-text).
