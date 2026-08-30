"use client"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

// Subscribes the browser to push and registers it on the server.
export async function enablePush(role: "admin" | "client", clientId?: string): Promise<boolean> {
  if (!pushSupported()) return false

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return false

  const reg = await navigator.serviceWorker.ready
  const res = await fetch("/api/push/subscribe")
  const { publicKey } = await res.json()
  if (!publicKey) return false

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const save = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role, clientId, subscription: sub.toJSON() }),
  })
  return save.ok
}
