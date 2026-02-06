'use client'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Application error</h1>
      <p>A server-side exception occurred.</p>
      {error.digest && <p>Digest: {error.digest}</p>}
      <p>If this is on Netlify, verify environment variables:</p>
      <ul>
        <li>NETLIFY_DATABASE_URL (or DATABASE_URL)</li>
        <li>NEXTAUTH_SECRET</li>
        <li>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET</li>
        <li>NEXTAUTH_URL</li>
      </ul>
      <button type="button" onClick={() => reset()}>Try again</button>
    </main>
  )
}
