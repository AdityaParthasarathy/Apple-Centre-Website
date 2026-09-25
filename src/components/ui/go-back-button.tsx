'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Session-storage keys shared with the gallery page (see FolderCard and
// GalleryScrollRestore): a folder card notes that the visitor came from the
// gallery and where they were on it, and this button tells the gallery to
// scroll back there when they return.
export const GALLERY_FROM_KEY = 'gallery:from-index'
export const GALLERY_SCROLL_KEY = 'gallery:scroll'
export const GALLERY_RESTORE_KEY = 'gallery:restore'

const remember = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Private mode and the like: the button still goes back, it just can't
    // remember the scroll position.
  }
}

/** Takes the visitor back to the gallery and to where they left off on it.
 *  Used the browser's own history when they arrived from the gallery (so the
 *  Back button and this one agree), and goes to /gallery directly when they
 *  landed on a folder from somewhere else — a shared link, a search result. */
export function GoBackButton({ fallbackHref = '/gallery', label = 'Go Back' }: { fallbackHref?: string; label?: string }) {
  const router = useRouter()

  // The browser's own Back button should land in the same place.
  useEffect(() => {
    const onPop = () => remember(GALLERY_RESTORE_KEY, '1')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const goBack = () => {
    remember(GALLERY_RESTORE_KEY, '1')
    let fromGallery = false
    try {
      fromGallery = sessionStorage.getItem(GALLERY_FROM_KEY) === '1'
    } catch {
      // treated as "not from the gallery"
    }
    if (fromGallery && window.history.length > 1) router.back()
    else router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={`${label} to the gallery`}
      className="group relative h-14 w-48 rounded-2xl border border-black/10 bg-white text-center text-xl font-semibold text-black shadow-md outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="absolute left-1 top-[4px] z-10 flex h-12 w-1/4 items-center justify-center rounded-xl bg-green-400 duration-500 group-hover:w-[184px]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="25px" width="25px" aria-hidden="true">
          <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#000000" />
          <path
            d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
            fill="#000000"
          />
        </svg>
      </div>
      <p className="translate-x-2">{label}</p>
    </button>
  )
}
