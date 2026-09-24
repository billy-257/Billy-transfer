export type SocialUser = {
  id: number
  username: string
  phone?: string
  displayName: string
  avatarUrl: string | null
  location?: string | null
  isAdmin?: boolean
  online?: boolean
  lastSeen?: string | null
}

// Human, Kirundi-friendly "last seen" label.
export function lastSeenLabel(iso: string | null | undefined): string {
  if (!iso) return "Ntiyaboneka"
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "Ubu nyene"
  if (min < 60) return `Haheze imunota ${min}`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `Haheze amasaha ${hr}`
  const d = Math.floor(hr / 24)
  if (d < 7) return `Haheze imisi ${d}`
  return new Date(iso).toLocaleDateString()
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
