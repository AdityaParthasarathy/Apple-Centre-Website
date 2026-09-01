/** Reads a file client-side as raw base64 (no re-encoding/resizing — for
 *  non-image uploads like a resume PDF, where compressImage's canvas
 *  re-encode doesn't apply). */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve({ base64: dataUrl.split(',')[1] ?? '', mimeType: file.type || 'application/octet-stream' })
    }
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}
