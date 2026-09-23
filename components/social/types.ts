export type SocialUser = {
  id: number
  username: string
  phone?: string
  displayName: string
  avatarUrl: string | null
  location?: string | null
  isAdmin?: boolean
}

export const socialFetcher = (url: string) => fetch(url).then((r) => r.json())

// Compress an image File to a compact JPEG data-URL for storage.
export async function compressImage(file: File, maxW = 1080): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxW / bitmap.width)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL("image/jpeg", 0.82)
}
