"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Search, UserPlus, Check, X, MessageCircle, Clock, Loader2 } from "lucide-react"
import { socialFetcher, type SocialUser } from "@/components/social/types"

type SearchResult = SocialUser & { status: "none" | "friends" | "incoming" | "outgoing" }

function Avatar({ user, size = 40 }: { user: SocialUser; size?: number }) {
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatarUrl || "/placeholder.svg"} alt={user.displayName} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="flex items-center justify-center rounded-full bg-emerald-500/20 font-black text-emerald-400" style={{ width: size, height: size }}>
      {user.displayName.charAt(0).toUpperCase()}
    </div>
  )
}

export function FriendsPanel({ onOpenChat }: { onOpenChat: (u: SocialUser) => void }) {
  const { data, mutate } = useSWR("/api/friends", socialFetcher, { refreshInterval: 15000 })
  const [q, setQ] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (q.trim().length < 1) {
      setResults([])
      return
    }
    let cancel = false
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q.trim())}`).then((r) => r.json())
      if (!cancel) {
        setResults(res.results || [])
        setSearching(false)
      }
    }, 300)
    return () => {
      cancel = true
      clearTimeout(t)
    }
  }, [q])

  async function sendRequest(id: number) {
    setResults((r) => r.map((u) => (u.id === id ? { ...u, status: "outgoing" } : u)))
    await fetch("/api/friends/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ toUserId: id }) })
    mutate()
  }

  async function respond(requestId: number, action: "accept" | "refuse") {
    await fetch("/api/friends/respond", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId, action }) })
    mutate()
  }

  const incoming = data?.incoming ?? []
  const outgoing = data?.outgoing ?? []
  const friends = data?.friends ?? []

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rondera abagenzi (izina canke inomero)"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {q.trim().length >= 1 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ivyavuye mu gushakisha</p>
          {searching ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
          {results.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
              <Avatar user={u} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{u.displayName}</p>
                <p className="truncate text-xs text-slate-500">@{u.username}</p>
              </div>
              {u.status === "friends" ? (
                <button onClick={() => onOpenChat(u)} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </button>
              ) : u.status === "outgoing" ? (
                <span className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400"><Clock className="h-3.5 w-3.5" /> Barindiriye</span>
              ) : u.status === "incoming" ? (
                <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400">Bakwipfuza</span>
              ) : (
                <button onClick={() => sendRequest(u.id)} className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950">
                  <UserPlus className="h-3.5 w-3.5" /> Ongera
                </button>
              )}
            </div>
          ))}
          {!searching && results.length === 0 ? <p className="text-sm text-slate-500">Nta muntu aboneka.</p> : null}
        </div>
      ) : null}

      {incoming.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Basavye kuba abagenzi</p>
          {incoming.map((x: { requestId: number; user: SocialUser }) => (
            <div key={x.requestId} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
              <Avatar user={x.user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{x.user.displayName}</p>
                <p className="truncate text-xs text-slate-500">@{x.user.username}</p>
              </div>
              <button onClick={() => respond(x.requestId, "accept")} className="rounded-full bg-emerald-500 p-2 text-slate-950"><Check className="h-4 w-4" /></button>
              <button onClick={() => respond(x.requestId, "refuse")} className="rounded-full bg-slate-800 p-2 text-slate-300"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Abagenzi bawe ({friends.length})</p>
        {friends.map((x: { requestId: number; user: SocialUser }) => (
          <div key={x.requestId} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <Avatar user={x.user} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{x.user.displayName}</p>
              <p className="truncate text-xs text-slate-500">@{x.user.username}</p>
            </div>
            <button onClick={() => onOpenChat(x.user)} className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
              <MessageCircle className="h-3.5 w-3.5" /> Chat
            </button>
          </div>
        ))}
        {friends.length === 0 ? <p className="text-sm text-slate-500">Ntugira abagenzi. Rondera hejuru wongere abagenzi.</p> : null}
        {outgoing.length > 0 ? <p className="pt-2 text-xs text-slate-600">Wasavye {outgoing.length} bantu, barindiriye kwemera.</p> : null}
      </div>
    </div>
  )
}
