# Development Setup

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

## Environment Variables
- Copy `.env.sample` to `.env.local` and update values:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/condo-parktrack
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

Referenced in:
- [mongodb.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/mongodb.ts)
- [auth.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/auth.ts)
- [middleware.ts](file:///Users/bluestella/repositories/rochester-parking/src/middleware.ts)

## Install & Run

```bash
npm install
npm run dev
```

Scripts defined in [package.json](file:///Users/bluestella/repositories/rochester-parking/package.json):
- `dev` → Next dev with Turbopack
- `build` → Next build with Turbopack
- `start` → Next start
- `lint` → ESLint
- `seed` → Seed database

## Database Seeding

- The seed script connects to `MONGODB_URI` and creates demo users and parking slots.
- It expects `.env.local` to be present.

Run:

```bash
npm run seed
```

See [seed.ts](file:///Users/bluestella/repositories/rochester-parking/scripts/seed.ts).

## TypeScript & Paths
- Path alias `@/*` maps to `src/*` per [tsconfig.json](file:///Users/bluestella/repositories/rochester-parking/tsconfig.json#L21-L23).

## Project Structure
See high-level structure in [README.md](file:///Users/bluestella/repositories/rochester-parking/README.md#L81-L96) and detailed architecture in [technical-architecture.md](file:///Users/bluestella/repositories/rochester-parking/.docs/technical-architecture.md).
