"use client"

import { useState } from "react"
import useSWR from "swr"
import { Bell, BellRing, UserPlus, Heart, MessageSquare, Check, CheckCheck } from "lucide-react"
import { enablePush } from "@/lib/push-client"
import { socialFetcher } from "@/components/social/types"

type Notif = { id: number; type: string; body: string; read: boolean; createdAt: string }

function icon(type: string) {
  if (type === "friend_request" || type === "friend_accept") return <UserPlus className="h-4 w-4 text-emerald-400" />
  if (type === "like") return <Heart className="h-4 w-4 text-red-400" />
  if (type === "comment") return <MessageSquare className="h-4 w-4 text-sky-400" />
  return <Bell className="h-4 w-4 text-amber-400" />
}

export function NotificationsPanel() {
  const { data, mutate } = useSWR("/api/notifications", socialFetcher, { refreshInterval: 15000 })
  const [pushMsg, setPushMsg] = useState("")
  const notifs: Notif[] = data?.notifications ?? []

  async function markAll() {
    await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) })
    mutate()
  }

  async function turnOnPush() {
    setPushMsg("")
    const res = await enablePush("client")
    setPushMsg(res.ok ? "Uzoronka integuza kuri iyi telefone!" : res.error || "Ntibishoboye.")
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-3 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={turnOnPush} className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
          <BellRing className="h-3.5 w-3.5" /> Emera integuza
        </button>
        <button onClick={markAll} className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300">
          <CheckCheck className="h-3.5 w-3.5" /> Soma vyose
        </button>
      </div>
      {pushMsg ? <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{pushMsg}</p> : null}

      {notifs.map((n) => (
        <div key={n.id} className={`flex items-start gap-3 rounded-xl border p-3 ${n.read ? "border-slate-800 bg-slate-900" : "border-emerald-500/30 bg-emerald-500/5"}`}>
          <div className="mt-0.5">{icon(n.type)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-200">{n.body}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
          {!n.read ? <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" /> : <Check className="mt-1 h-3.5 w-3.5 text-slate-600" />}
        </div>
      ))}
      {notifs.length === 0 ? <p className="pt-6 text-center text-sm text-slate-500">Nta ntuza uragira.</p> : null}
    </div>
  )
}
