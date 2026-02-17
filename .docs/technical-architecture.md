# Technical Architecture: Condo ParkTrack

## High-Level Overview

Condo ParkTrack is a modern, full-stack web application designed for condominium parking management. It leverages the **Next.js** framework for both frontend and backend capabilities, ensuring a unified and performant codebase. Data persistence is handled by **MongoDB**, while security is enforced through **NextAuth.js** for authentication and **Permit.io** for fine-grained Role-Based Access Control (RBAC).

## Technology Stack

### Frontend Layer
- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
  - Utilizes React Server Components (RSC) for improved performance and SEO.
  - Client-side interactivity for forms and real-time updates.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  - Utility-first CSS framework for rapid, responsive UI development.
- **UI Component Library:** [shadcn/ui](https://ui.shadcn.com/)
  - Accessible, customizable components (based on Radix UI) for a professional look and feel.
- **State Management:** React Hooks & Context API.

### Backend Layer
- **Runtime:** Node.js (via Next.js API Routes).
- **API Architecture:** RESTful API endpoints.
- **Validation:** [Zod](https://zod.dev/) for strict runtime request/response schema validation.

### Database & Storage
- **Database:** [MongoDB](https://www.mongodb.com/) (hosted on MongoDB Atlas).
- **ODM:** [Mongoose](https://mongoosejs.com/) for schema-based data modeling and application logic.
- **Data Models:**
  - `User`: Stores account details, roles, and references.
  - `ParkingRecord`: Tracks vehicle entry/exit, timestamps, and duration.
  - `AuditLog`: Records system activities for security and compliance.

### Security Infrastructure
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
  - JWT (JSON Web Token) based session management.
  - Credentials provider for secure email/password login.
  - Password hashing with `bcryptjs`.
- **Authorization (RBAC):** [Permit.io](https://permit.io/)
  - Decoupled policy enforcement point (PEP).
  - Fine-grained permissions (Create, Read, Update, Delete) based on user roles (Admin, Guard, Resident).
  - Middleware intercepts requests to verify permissions before processing.

### Infrastructure & Deployment
- **Hosting:** [Vercel](https://vercel.com/) (optimized for Next.js).
- **CI/CD:** Automated deployments via Vercel Git integration.
- **Environment Management:** strict separation of secrets via `.env` variables.

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
        DB[(MongoDB Atlas)]
        Permit[Permit.io PDP \n(Policy Decision Point)]
    end

    Client -->|HTTPS| LB
    LB --> NextApp
    UI -->|Fetch / Server Actions| API
    
    API -->|Auth Check| API
    API -->|Permission Check| Permit
    API -->|Read/Write Data| DB
```

## Key Architectural Decisions

1.  **Unified Monorepo Structure:** Using Next.js for both frontend and backend simplifies development, type sharing (TypeScript), and deployment.
2.  **Externalized Authorization:** Offloading complex permission logic to Permit.io prevents "spaghetti code" in business logic and allows for dynamic policy updates without redeploying the app.
3.  **Schemaless Database with Strict Modeling:** MongoDB offers flexibility for evolving data requirements, while Mongoose enforces necessary structure and validation at the application level.
4.  **Mobile-First Design:** The architecture prioritizes responsive delivery to support security guards using tablets or smartphones on-site.
