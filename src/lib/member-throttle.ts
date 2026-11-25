// Brakes on guessing a classmate's password, and on mass-creating accounts.
// Kept in memory, so each server instance counts separately: a brake, not a lock.

const WINDOW_MS = 15 * 60_000
const MAX_WRONG = 8

const wrongTries = new Map<string, { count: number; since: number }>()

export function addressOf(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}

export function lockedOut(key: string) {
  const entry = wrongTries.get(key)
  if (!entry) return false
  if (Date.now() - entry.since > WINDOW_MS) {
    wrongTries.delete(key)
    return false
  }
  return entry.count >= MAX_WRONG
}

export function noteWrong(key: string) {
  const entry = wrongTries.get(key)
  if (!entry || Date.now() - entry.since > WINDOW_MS) wrongTries.set(key, { count: 1, since: Date.now() })
  else entry.count++
}

export function clearWrong(key: string) {
  wrongTries.delete(key)
}

const CREATE_WINDOW_MS = 60 * 60_000
const MAX_CREATED = 10
const created = new Map<string, { count: number; since: number }>()

/** True if this address may make another account (10 an hour). */
export function mayCreateAccount(address: string) {
  const entry = created.get(address)
  if (!entry || Date.now() - entry.since > CREATE_WINDOW_MS) return true
  return entry.count < MAX_CREATED
}

export function noteAccountCreated(address: string) {
  const entry = created.get(address)
  if (!entry || Date.now() - entry.since > CREATE_WINDOW_MS) created.set(address, { count: 1, since: Date.now() })
  else entry.count++
}
