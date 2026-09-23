"use client"

import { useState } from "react"
import { Loader2, UserPlus, LogIn } from "lucide-react"
import { enablePush } from "@/lib/push-client"
import type { SocialUser } from "@/components/social/types"

export function AuthForms({ onAuthed }: { onAuthed: (u: SocialUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  // register fields
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  // login field
  const [identifier, setIdentifier] = useState("")

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const res =
        mode === "register"
          ? await fetch("/api/auth/register", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ displayName, username, phone, password }),
            })
          : await fetch("/api/auth/login", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ identifier, password }),
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
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-6 flex items-center justify-center gap-3">
        <img src="/brand/billy-face.jpg" alt="BILLY FASTER TRANSFER" className="h-14 w-14 rounded-full border-2 border-emerald-500 object-cover" />
        <div>
          <p className="text-base font-black text-white">BILLY FASTER TRANSFER</p>
          <p className="text-xs text-slate-400">Iyandikishe uhurire n&apos;abagenzi</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
        <button
          onClick={() => setMode("login")}
          className={`rounded-lg py-2 text-xs font-bold transition ${mode === "login" ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}
        >
          Injira
        </button>
        <button
          onClick={() => setMode("register")}
          className={`rounded-lg py-2 text-xs font-bold transition ${mode === "register" ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}
        >
          Iyandikishe
        </button>
      </div>

      <div className="space-y-3">
        {mode === "register" ? (
          <>
            <input className={input} placeholder="Izina rizoboneka (display name)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <input className={input} placeholder="Username (a-z, 0-9, _)" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className={input} placeholder="Inomero ya telefone (+9715...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={input} type="password" placeholder="Ijambo ry'ibanga" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        ) : (
          <>
            <input className={input} placeholder="Username canke inomero ya telefone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            <input
              className={input}
              type="password"
              placeholder="Ijambo ry'ibanga"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
              }}
            />
          </>
        )}

        {error ? <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">{error}</p> : null}

        <button
          onClick={submit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "register" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {mode === "register" ? "Iyandikishe" : "Injira"}
        </button>
      </div>
    </div>
  )
}
