"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, Lock, MapPin, Moon, Sun, User, BellRing, LogOut, Check, ShieldCheck } from "lucide-react"
import { compressImage, type SocialUser } from "@/components/social/types"
import { useTheme } from "@/lib/use-theme"
import { enablePush } from "@/lib/push-client"

function Avatar({ url, name, size = 88 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url || "/placeholder.svg"} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="flex items-center justify-center rounded-full bg-emerald-500/20 text-3xl font-black text-emerald-400" style={{ width: size, height: size }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function SettingsPanel({ me, onSaved, onLogout }: { me: SocialUser; onSaved: () => void; onLogout: () => void }) {
  const { theme, setTheme } = useTheme()

  const [displayName, setDisplayName] = useState(me.displayName)
  const [location, setLocation] = useState(me.location ?? "")
  const [avatar, setAvatar] = useState<string | null>(me.avatarUrl)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null)
  const [pushMsg, setPushMsg] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setAvatar(await compressImage(file, 640))
  }

  async function saveProfile() {
    setSavingProfile(true)
    setMsg(null)
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName, location, avatarUrl: avatar ?? "" }),
    })
    const data = await res.json().catch(() => ({}))
    setSavingProfile(false)
    if (data.ok) {
      setMsg({ kind: "ok", text: "Umwidondoro wawe wahinduwe! Bishizwe no ku Amafoto." })
      onSaved()
    } else {
      setMsg({ kind: "err", text: data.error || "Ntibishoboye." })
    }
  }

  async function savePassword() {
    if (!newPassword) return
    setSavingPw(true)
    setMsg(null)
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json().catch(() => ({}))
    setSavingPw(false)
    if (data.ok) {
      setCurrentPassword("")
      setNewPassword("")
      setMsg({ kind: "ok", text: "Ijambo ry'ibanga ryahinduwe!" })
    } else {
      setMsg({ kind: "err", text: data.error || "Ntibishoboye." })
    }
  }

  async function turnOnPush() {
    setPushMsg("")
    const res = await enablePush("client")
    setPushMsg(res.ok ? "Uzoronka integuza kuri iyi telefone!" : res.error || "Ntibishoboye.")
  }

  const field =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
  const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400"
  const card = "rounded-2xl border border-slate-800 bg-slate-900 p-4"

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-4">
      {msg ? (
        <p className={`rounded-xl px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>
      ) : null}

      {/* Profile */}
      <div className={card}>
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
          <User className="h-4 w-4 text-emerald-400" /> Umwidondoro
          {me.isAdmin ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : null}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="relative" aria-label="Hindura ifoto">
            <Avatar url={avatar} name={displayName || me.displayName} />
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-500 text-slate-950">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className={label}>Izina</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={field} placeholder="Izina ryawe" />
          </div>
          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Igisagara / Igihugu
              </span>
            </label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={field} placeholder="Aho uba (urugero: Bujumbura)" />
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-black text-slate-950 disabled:opacity-60"
          >
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Bika impinduka
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className={card}>
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
          {theme === "light" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-400" />} Ubwoko bw'urumuri
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${theme === "dark" ? "bg-slate-800 text-white" : "text-slate-400"}`}
          >
            <Moon className="h-4 w-4" /> Umukara
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${theme === "light" ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}
          >
            <Sun className="h-4 w-4" /> Umweru
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className={card}>
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
          <BellRing className="h-4 w-4 text-amber-400" /> Integuza
        </div>
        <button onClick={turnOnPush} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-400">
          <BellRing className="h-4 w-4" /> Emera integuza kuri iyi telefone
        </button>
        {pushMsg ? <p className="mt-2 text-center text-xs text-emerald-300">{pushMsg}</p> : null}
      </div>

      {/* Password */}
      <div className={card}>
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
          <Lock className="h-4 w-4 text-red-400" /> Hindura ijambo ry'ibanga
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={field}
            placeholder="Ijambo ry'ibanga rya kera"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={field}
            placeholder="Ijambo ry'ibanga rishasha"
          />
          <button
            onClick={savePassword}
            disabled={savingPw || !newPassword}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 py-2.5 text-sm font-black text-white disabled:opacity-50"
          >
            {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Hindura
          </button>
        </div>
      </div>

      <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-black text-red-400">
        <LogOut className="h-4 w-4" /> Sohoka
      </button>
    </div>
  )
}
