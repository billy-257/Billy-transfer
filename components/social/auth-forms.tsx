"use client"

import { useState } from "react"
import { Loader2, LogIn } from "lucide-react"
import { enablePush } from "@/lib/push-client"
import type { SocialUser } from "@/components/social/types"

// Phone-number-only entry: the visitor types their phone number and taps Injira.
// No username, no password — a new number is registered automatically.
export function AuthForms({ onAuthed }: { onAuthed: (u: SocialUser) => void }) {
  const [phone, setPhone] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (busy) return
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

  const input =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-lg font-bold tracking-wide text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-6 flex items-center justify-center gap-3">
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
        <input
          id="phone"
          className={input}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+9715..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
          }}
        />

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
