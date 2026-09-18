"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

type Popup = {
  active: boolean
  title?: string
  body?: string
  imageUrl?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  version: string
}

const SEEN_KEY = "billy_popup_seen_version"

// Shows the admin-controlled popup when the app opens, once per version per device.
export function AppPopup() {
  const [popup, setPopup] = useState<Popup | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Small delay so it appears after the app paints, like a real "on open" popup.
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/popup", { cache: "no-store" })
        const data: Popup = await res.json()
        if (cancelled || !data.active || !data.body) return
        const seen = typeof window !== "undefined" ? window.localStorage.getItem(SEEN_KEY) : null
        if (seen === data.version) return // already shown this version on this device
        setPopup(data)
        setOpen(true)
      } catch {
        // ignore — popup is non-critical
      }
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  function dismiss() {
    if (popup) {
      try {
        window.localStorage.setItem(SEEN_KEY, popup.version)
      } catch {
        // ignore
      }
    }
    setOpen(false)
  }

  if (!open || !popup) return null

  const hasCta = !!(popup.ctaUrl || popup.ctaLabel)

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || "Itangazo"}
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm animate-in overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {popup.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={popup.imageUrl || "/placeholder.svg"} alt="" className="max-h-60 w-full object-cover" />
          ) : null}
          <button
            onClick={dismiss}
            aria-label="Funga"
            className="absolute right-3 top-3 rounded-full bg-slate-950/70 p-2 text-white transition hover:bg-slate-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {popup.title ? <h3 className="mb-2 text-xl font-black text-white text-balance">{popup.title}</h3> : null}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{popup.body}</p>

          {hasCta ? (
            <a
              href={popup.ctaUrl || "#"}
              onClick={dismiss}
              className="mt-5 block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              {popup.ctaLabel || "Reba"}
            </a>
          ) : (
            <button
              onClick={dismiss}
              className="mt-5 block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              Nabonye
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
