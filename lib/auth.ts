// Simple auth utilities for password hashing and session management
// Uses Web Crypto API for hashing (no external dependencies)

// Hash a password using SHA-256 with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const data = new TextEncoder().encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}:${hashHex}`
}

// Verify a password against a hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const data = new TextEncoder().encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex === hash
}

// Hash a 6-digit PIN (simpler, no salt needed for PIN)
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify a PIN
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const pinHash = await hashPin(pin)
  return pinHash === storedHash
}

// Session token generation (simple UUID-based)
export function generateSessionToken(): string {
  return crypto.randomUUID()
}

// User session type
export interface UserSession {
  userId: string
  username: string
  token: string
  expiresAt: number // timestamp
}

// Session duration (7 days)
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000
