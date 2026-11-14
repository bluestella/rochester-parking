// One secret for both NextAuth and the middleware. The development fallback
// keeps `npm run dev` working without an .env file; production must set it.
export const authSecret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-change-me');
