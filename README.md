# Condo Parking PWA

Features
- Google SSO using NextAuth
- Roles: Admin, Guards, Residents
- Guard: add parking entries and mark exit with timestamp
- Resident: view active and historical parking records
- Admin: manage users (view, add, edit, delete)
- PWA manifest and service worker for installable experience
- Netlify deployment with database via DATABASE_URL

Getting Started
- Set environment variables in .env based on .env.example
- Ensure DATABASE_URL points to your Netlify-managed Postgres
- Install dependencies and run development server
  - npm install
  - npm run dev
- For production on Netlify, set env vars in site settings and deploy

Prisma
- After setting DATABASE_URL, generate client and run migrations
  - npm run prisma:generate
  - npx prisma migrate deploy

Key Pages
- /: sign-in entry
- /dashboard: role-based navigation
- /parking/new: add parking entry
- /parking: active parking list, mark exit
- /resident/history: resident records
- /admin/users: user administration
