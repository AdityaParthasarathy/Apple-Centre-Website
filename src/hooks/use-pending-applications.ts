'use client'

import { useSyncExternalStore } from 'react'

// How many applications are still "Pending" — nobody has reviewed, accepted or
// declined them yet — shown as the red marker on the portal's Applications link.
//
// The portal's side panel and its small-screen drawer both show the marker, and
// the Applications page changes it when a status changes, so the count lives
// here once instead of in each of them: one shared number, one timer.

const POLL_MS = 60_000

let count: number | null = null // null until the first answer arrives
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined

function publish(next: number | null) {
  if (next === count) return
  count = next
  listeners.forEach((listener) => listener())
}

async function refresh() {
  try {
    const res = await fetch('/api/staff/applications', { cache: 'no-store' })
    if (!res.ok) return
    const body = (await res.json()) as { items?: { status?: string }[] }
    if (Array.isArray(body.items)) publish(body.items.filter((a) => (a.status || 'Pending') === 'Pending').length)
  } catch {
    // Offline or Google is slow: keep showing the last number.
  }
}

const onVisible = () => {
  if (document.visibilityState === 'visible') void refresh()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    void refresh()
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, POLL_MS)
    document.addEventListener('visibilitychange', onVisible)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }
}

/** The number of applications waiting for a decision, or null before it is known. */
export function usePendingApplications(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => count,
    () => null
  )
}

/** For the Applications page: it already knows the exact list, so it tells the
 *  marker right away rather than leaving it to the next poll. */
export function setPendingApplications(next: number) {
  publish(next)
}
