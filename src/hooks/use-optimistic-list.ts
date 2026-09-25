'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Every staff save goes through Google Apps Script, which takes anywhere from
// 3s to 40s to answer. Waiting for it before the screen changes made the
// whole portal feel frozen, so the list changes at once and the server call
// happens behind it: an added or edited item shows immediately marked
// "Saving…", and if Google ultimately refuses it the list goes back to how it
// was and the caller is told so it can hand the form its typing back.

export type SaveResult = { ok: true } | { ok: false; message: string }

interface Config {
  /** e.g. '/api/staff/projects' — item routes are `${endpoint}/${id}`. */
  endpoint: string
  /** Where the created row comes back in the POST reply ('project', 'member', 'image'…). */
  itemKey: string
  /** What to call it in an error ("project"). */
  noun: string
  /** New items go at the top (default) or the bottom of the list. */
  addAt?: 'start' | 'end'
  /** How many more times to send an add the server says saved nothing (photo uploads, when Google drops the reply). */
  retries?: number
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function send(url: string, method: string, payload?: unknown): Promise<{ ok: boolean; body: Record<string, unknown> | null }> {
  const res = await fetch(url, { method, headers: JSON_HEADERS, body: payload === undefined ? undefined : JSON.stringify(payload) })
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null
  return { ok: res.ok, body }
}

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

/** A ref that always holds the newest value — for code that runs after an
 *  await and needs to know what the screen holds NOW, not when it started. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

export function useOptimisticList<T extends { id: string }>(initial: T[], { endpoint, itemKey, noun, addAt = 'start', retries = 0 }: Config) {
  const [items, setItems] = useState<T[]>(initial)
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  // The latest list, for rollbacks that need to know where an item was.
  const latest = useLatest(items)

  const setPendingId = useCallback((id: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  /** Shows several drafts at once, all marked "saving", ahead of their turns
   *  in a queue — pass `{ staged: true }` to `add` for each of them. */
  const stage = useCallback(
    (drafts: T[]) => {
      setItems((prev) => (addAt === 'start' ? [...drafts, ...prev] : [...prev, ...drafts]))
      setPending((prev) => new Set([...prev, ...drafts.map((d) => d.id)]))
    },
    [addAt]
  )

  /** `draft` (with a temporary id) is shown straight away; the server's own row replaces it. */
  const add = useCallback(
    async (payload: unknown, draft: T, { staged = false }: { staged?: boolean } = {}): Promise<SaveResult> => {
      if (!staged) {
        setItems((prev) => (addAt === 'start' ? [draft, ...prev] : [...prev, draft]))
        setPendingId(draft.id, true)
      }
      try {
        let { ok, body } = await send(endpoint, 'POST', payload)
        // The tile stays up as "Uploading…" while a photo the server could
        // not store is sent again.
        for (let again = 0; !ok && body?.retryable === true && again < retries; again++) {
          ;({ ok, body } = await send(endpoint, 'POST', payload))
        }
        if (!ok) throw new Error((body?.error as string) ?? `Failed to save the ${noun}.`)
        const saved = body?.[itemKey] as T | undefined
        setItems((prev) => prev.map((item) => (item.id === draft.id ? (saved ?? draft) : item)))
        return { ok: true }
      } catch (err) {
        setItems((prev) => prev.filter((item) => item.id !== draft.id))
        return { ok: false, message: messageOf(err, `Couldn't save the ${noun}. Check your connection and try again.`) }
      } finally {
        setPendingId(draft.id, false)
      }
    },
    [endpoint, itemKey, noun, addAt, retries, setPendingId]
  )

  /** `next` replaces the item on screen at once; on failure the old one comes back. */
  const update = useCallback(
    async (id: string, payload: unknown, next: T): Promise<SaveResult> => {
      const previous = latest.current.find((item) => item.id === id)
      setItems((prev) => prev.map((item) => (item.id === id ? next : item)))
      setPendingId(id, true)
      try {
        const { ok, body } = await send(`${endpoint}/${id}`, 'PATCH', payload)
        if (!ok) throw new Error((body?.error as string) ?? `Failed to update the ${noun}.`)
        return { ok: true }
      } catch (err) {
        if (previous) setItems((prev) => prev.map((item) => (item.id === id ? previous : item)))
        return { ok: false, message: messageOf(err, `Couldn't update the ${noun}. Check your connection and try again.`) }
      } finally {
        setPendingId(id, false)
      }
    },
    [endpoint, noun, setPendingId, latest]
  )

  /** The item disappears at once; on failure it goes back where it was. */
  const remove = useCallback(
    async (id: string): Promise<SaveResult> => {
      const index = latest.current.findIndex((item) => item.id === id)
      const removed = latest.current[index]
      setItems((prev) => prev.filter((item) => item.id !== id))
      try {
        const { ok, body } = await send(`${endpoint}/${id}`, 'DELETE')
        if (!ok) throw new Error((body?.error as string) ?? `Failed to delete the ${noun}.`)
        return { ok: true }
      } catch (err) {
        if (removed) {
          setItems((prev) => {
            const copy = [...prev]
            copy.splice(Math.min(index, copy.length), 0, removed)
            return copy
          })
        }
        return { ok: false, message: messageOf(err, `Failed to delete the ${noun}.`) }
      }
    },
    [endpoint, noun, latest]
  )

  return { items, setItems, pending, stage, add, update, remove }
}

/** A throwaway id for an item that exists only on screen until the server confirms it. */
export const tempId = () => `pending-${crypto.randomUUID()}`
