export function getEnv(name: string) {
  const raw = process.env[name]
  if (!raw) return undefined
  const trimmed = raw.trim()
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export function requireEnv(name: string) {
  const value = getEnv(name)
  if (!value) throw new Error(`Missing ${name}`)
  return value
}
