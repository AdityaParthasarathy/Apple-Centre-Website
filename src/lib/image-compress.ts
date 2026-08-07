const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

/** Downscales + re-encodes as JPEG client-side, so uploads stay small and fast
 *  regardless of the original photo's size — a Drive upload through Apps
 *  Script has no business carrying a 12MB phone photo when 300KB looks the same. */
export function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas is not supported in this browser.'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read that image file.'))
    }
    img.src = objectUrl
  })
}
