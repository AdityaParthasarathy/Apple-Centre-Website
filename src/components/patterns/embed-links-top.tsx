'use client'

import { useEffect } from 'react'

/** Inside an iMac window, a link to another page of this site should open
 *  that page in the real browser window, not load it inside the little
 *  screen. */
export function EmbedLinksTop() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || window.top === window) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      event.preventDefault()
      event.stopPropagation()
      window.top?.location.assign(url.href)
    }
    // Capture phase: runs before Next's own <Link> handler would navigate inside the frame.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
