# AI Quick Reference

## Stack & Structure
- Next.js 15 App Router (React 19)
- API routes under `src/app/api/*`
- MongoDB via Mongoose with cached connection: [mongodb.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/mongodb.ts)
- Auth with NextAuth credentials + JWT: [auth.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/auth.ts)
- RBAC helpers and guards: [rbac.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/rbac.ts), [middleware.ts](file:///Users/bluestella/repositories/rochester-parking/src/middleware.ts)
- Validation schemas (Zod): [validations.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/validations.ts)
- Models: [models/index.ts](file:///Users/bluestella/repositories/rochester-parking/src/models/index.ts)

## Environment
- Required vars in `.env.local`:
  - `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Seed uses `.env.local`: [scripts/seed.ts](file:///Users/bluestella/repositories/rochester-parking/scripts/seed.ts)

## Conventions
- Path alias `@/*` → `src/*` per [tsconfig.json](file:///Users/bluestella/repositories/rochester-parking/tsconfig.json#L21-L23)
- Return API responses using Next.js route handlers and `NextResponse.json`
- Use Zod schemas from [validations.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/validations.ts) for request validation
- Enforce permissions via `requireRole`/`requirePermission` and middleware guards

## Common Tasks
- Add an API route
  - Create folder under `src/app/api/<feature>` with `route.ts`
  - Validate input with Zod; connect DB via `connectDB()` if needed
  - Authorize using helpers; use `NextResponse.json({success:true,data})`

- Add a model
  - Define schema in `src/models/<Name>.ts`, export in [models/index.ts](file:///Users/bluestella/repositories/rochester-parking/src/models/index.ts)
  - Add useful indices; use `select: false` for sensitive fields

- Protect a page/section
  - Add path and roles to [middleware.ts](file:///Users/bluestella/repositories/rochester-parking/src/middleware.ts)

## Key Links
- Architecture: [technical-architecture.md](file:///Users/bluestella/repositories/rochester-parking/.docs/technical-architecture.md)
- Development: [development.md](file:///Users/bluestella/repositories/rochester-parking/.docs/development.md)
- RBAC: [rbac.md](file:///Users/bluestella/repositories/rochester-parking/.docs/rbac.md)
- API: [api-overview.md](file:///Users/bluestella/repositories/rochester-parking/.docs/api-overview.md)
