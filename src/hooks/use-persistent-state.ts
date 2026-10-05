'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/** `useState` that survives leaving the page. The staff forms use it so that
 *  half-typed work isn't lost by clicking over to another section (which
 *  unmounts the form) or by a refresh. It is kept in sessionStorage — it lasts
 *  for the tab, not for ever, so a draft doesn't greet the next person who
 *  signs in on a shared computer.
 *
 *  The draft is dropped as soon as the value is back to `initial` (the form was
 *  submitted or cancelled). The first render always uses `initial`, so the
 *  server and browser markup agree; a saved draft is filled in right after. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    // In a microtask rather than straight in the effect: filling the form is a
    // reaction to storage (an outside system) arriving, not part of rendering.
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      try {
        const saved = window.sessionStorage.getItem(key)
        if (saved !== null) setValue(JSON.parse(saved) as T)
      } catch {
        // Storage blocked or the draft is unreadable: start from a clean form.
      }
      setRestored(true)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    // Not before the restore above, or an empty form would erase the draft.
    if (!restored) return
    try {
      const text = JSON.stringify(value)
      if (text === JSON.stringify(initial)) window.sessionStorage.removeItem(key)
      else window.sessionStorage.setItem(key, text)
    } catch {
      // Out of space or blocked: the form still works, it just isn't kept.
    }
  }, [key, value, initial, restored])

  return [value, setValue]
}
