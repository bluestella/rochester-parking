# Technical Architecture: Condo ParkTrack

## High-Level Overview

Condo ParkTrack is a modern, full-stack web application for condominium parking management. It uses **Next.js 15 (App Router)** for both frontend UI and backend API routes in a single codebase. Data is stored in **MongoDB** via **Mongoose**. Authentication is handled by **NextAuth.js** (credentials provider with JWT sessions), and authorization is enforced through a **custom RBAC** layer implemented in middleware and helper utilities.

## Technology Stack

### Frontend Layer
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
  - React 19 with Server Components for performance and SEO.
  - Client components for interactivity and data entry.
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) built on Radix UI.
- **State Management:** React Hooks and lightweight local state.

### Backend Layer
- **Runtime:** Node.js via Next.js API Routes.
- **API Style:** RESTful handlers under `src/app/api/*`.
- **Validation:** [Zod](https://zod.dev/) for runtime request/response validation.

### Database & Storage
- **Database:** [MongoDB](https://www.mongodb.com/) (Atlas or local).
- **ODM:** [Mongoose](https://mongoosejs.com/) with connection caching.
- **Core Models:**
  - `User`, `Vehicle`, `ParkingSlot`, `ParkingRecord`, `AuditLog`, `Building`
  - See [index.ts](file:///Users/bluestella/repositories/rochester-parking/src/models/index.ts) for exports

### Security Infrastructure
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
  - JWT session strategy; credentials provider; `bcryptjs` for hashing
  - Config in [auth.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/auth.ts)
- **Authorization (RBAC):** Custom role/permission matrix
  - Helpers and permission checks in [rbac.ts](file:///Users/bluestella/repositories/rochester-parking/src/lib/rbac.ts)
  - Route guards in [middleware.ts](file:///Users/bluestella/repositories/rochester-parking/src/middleware.ts)

### Infrastructure & Deployment
- **Hosting:** [Vercel](https://vercel.com/) recommended for Next.js
- **CI/CD:** Vercel Git integration
- **Environment:** `.env.local` with `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

## System Architecture Diagram

```mermaid
graph TD
    Client[Client Browser \n(Desktop/Mobile)]
    
    subgraph "Vercel Infrastructure"
        LB[Load Balancer]
        NextApp[Next.js Application]
        
        subgraph "Next.js App Router"
            UI[Frontend UI \n(React Components)]
            API[API Routes \n(Node.js)]
        end
    end
    
    subgraph "External Services"
        DB[(MongoDB)]
    end

    Client -->|HTTPS| LB
    LB --> NextApp
    UI -->|Fetch / Server Actions| API
    
    API -->|Auth Check (NextAuth JWT)| API
    API -->|Read/Write Data| DB
```

## Key Architectural Decisions

1. **Single Codebase:** Next.js App Router powers both UI and API routes for faster iteration.
2. **Custom RBAC:** A simple, explicit permission matrix keeps authorization close to code and easy to audit.
3. **Schema-Based Modeling:** Mongoose enforces structure and indices over flexible MongoDB collections.
4. **Operational UX:** Mobile-friendly design supports guards using tablets or phones.
