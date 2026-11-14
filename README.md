# Rochester

Condominium management built with Next.js 15, MongoDB and NextAuth.js: parking, monthly dues, facilities and community, for the admin office, the guards and every resident.

## Features

- **Parking**: gate log, live deck map, reserved/visitor/PWD slots, vehicle registry, visitor passes
- **Dues and billing**: monthly statements per unit, payments with receipts, resident-reported payments, late charges, receivables ageing, CSV export
- **Facilities**: amenity bookings with approval and fees, service requests with history, equipment maintenance
- **Community and admin**: units and owners, announcements, role-based access (admin, guard, resident), activity log
- **Design system**: tokens, light and dark themes, shared components. See `docs/design-system.md` and `/admin/design-system`

`npm run seed` loads demo data. It **wipes the database it points at** and refuses to run with `NODE_ENV=production`.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with credentials provider

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file (copy from `.env.example`):
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/condo-parktrack
   NEXTAUTH_SECRET=your-super-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Run the seed script to create demo users and parking slots:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super admin | superadmin@parktrack.com | super123 |
| Admin | admin@parktrack.com | admin123 |
| Accountant | accountant@parktrack.com | accountant123 |
| Maintenance | maintenance@parktrack.com | maintenance123 |
| Guard | guard@parktrack.com | guard123 |
| Resident | resident@parktrack.com | resident123 |

## User Roles

### Super admin
- Full access to every feature
- The only role that can create or change office accounts (super admin, admin, accountant, maintenance)
- Billing settings, hard deletes (parking records, buildings, slots, units) and the activity log

### Admin (property administration)
- Residents and guards, units, buildings, parking slots, vehicles
- Gate log, visitors, amenities and bookings, service requests, announcements
- Billing is view-only; equipment is view-only

### Accountant
- Dues and billing: issue statements, record and confirm payments, late charges, rates, CSV export
- Read-only access to units and residents for billing

### Maintenance
- Service requests (triage, status, assignment)
- Equipment and preventive maintenance

### Guard
- Record vehicle entries and exits
- View all parking records
- Register vehicles for any owner

### Resident
- View own parking history
- Register own vehicles
- Export parking history to CSV

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin pages
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── parking/          # Parking management pages
│   └── resident/         # Resident portal pages
├── components/           # React components
├── lib/                  # Utilities and configurations
├── models/               # Mongoose models
└── types/                # TypeScript type definitions
```

## License

MIT
