"use client"

import { useState } from "react"
import { Loader2, LogIn } from "lucide-react"
import { enablePush } from "@/lib/push-client"
import type { SocialUser } from "@/components/social/types"

// Country dial codes offered at login. +971 (UAE) is the default.
const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+257", label: "🇧🇮 +257" },
  { code: "+250", label: "🇷🇼 +250" },
  { code: "+255", label: "🇹🇿 +255" },
  { code: "+256", label: "🇺🇬 +256" },
  { code: "+254", label: "🇰🇪 +254" },
  { code: "+243", label: "🇨🇩 +243" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+90", label: "🇹🇷 +90" },
  { code: "+86", label: "🇨🇳 +86" },
]

// Phone-number-only entry: the visitor picks their country code, types the rest
// of their number and taps Injira. No username, no password — a new number is
// registered automatically.
export function AuthForms({ onAuthed }: { onAuthed: (u: SocialUser) => void }) {
  const [countryCode, setCountryCode] = useState("+971")
  const [local, setLocal] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (busy) return
    // Combine the dial code with the local number (drop any leading zeros / non-digits).
    const localDigits = local.replace(/[^0-9]/g, "").replace(/^0+/, "")
    if (localDigits.length < 6) {
      setError("Andika inomero ya telefone nyayo.")
      return
    }
    const phone = `${countryCode}${localDigits}`
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || "Ntibishoboye.")
        return
      }
      // Best-effort: turn on push so this user gets notifications.
      enablePush("client").catch(() => {})
      onAuthed(data.user)
    } catch {
      setError("Ntibishoboye. Gerageza kandi.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-6 flex items-center justify-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/billy-face.jpg" alt="BILLY FASTER TRANSFER" className="h-14 w-14 rounded-full border-2 border-emerald-500 object-cover" />
        <div>
          <p className="text-base font-black text-white">BILLY FASTER TRANSFER</p>
          <p className="text-xs text-slate-400">Andika inomero yawe winjire</p>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="phone" className="block text-center text-xs font-bold uppercase tracking-wide text-slate-400">
          Inomero ya telefone
        </label>

        <div className="flex gap-2">
          <select
            aria-label="Igihugu (country code)"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base font-bold text-white focus:border-emerald-500 focus:outline-none"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            id="phone"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-bold tracking-wide text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="552256963"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
            }}
          />
        </div>

        <p className="text-center text-xs text-slate-500">
          {countryCode} {local.replace(/[^0-9]/g, "").replace(/^0+/, "") || "..."}
        </p>

        {error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-300">{error}</p> : null}

        <button
          onClick={submit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Injira
        </button>
      </div>
    </div>
  )
}
