import { NextResponse } from 'next/server'
import { PHOTO_NOT_SAVED } from '@/lib/apps-script'

/** The JSON body for a staff API route whose call to Google failed. Names the
 *  cause when it is one staff can act on, and never forwards Google's own
 *  text: for the folder mistake it echoes the value it was given, which was
 *  the Apps Script secret. */
export function failureResponse(error: unknown, fallback: string) {
  const text = error instanceof Error ? error.message : ''

  let message = fallback
  // Only when nothing at all was saved, so trying again cannot double anything.
  let retryable = false
  if (/GALLERY_FOLDER_ID|Invalid file or folder ID/i.test(text)) {
    // The Drive folder setting in Code.gs is missing or wrong (see uploadImageToDrive).
    message =
      'Photo storage is not set up: GALLERY_FOLDER_ID in the Apps Script must be your Drive folder ID. Ask whoever manages the script to fix it.'
  } else if (text.startsWith(PHOTO_NOT_SAVED)) {
    // The picture never reached Drive, so no row was made: safe to just retry.
    message = "The photo didn't finish uploading to Google Drive, so nothing was saved. Please try again."
    retryable = true
  } else if (/got no reply|reply was not JSON/i.test(text)) {
    // Google never answered in time, or answered with its own error page
    // instead of ours (see AppsScriptAmbiguousError in apps-script.ts). The
    // change may well have been saved, so say that rather than just "failed".
    message =
      "Google was too slow or gave an unclear answer, so we couldn't confirm it. Refresh the page to check whether it saved, and try again if it didn't."
  }

  return NextResponse.json({ error: message, ...(retryable ? { retryable: true } : {}) }, { status: 502 })
}
