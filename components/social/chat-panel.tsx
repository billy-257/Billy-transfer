"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { Send, ArrowLeft, MessageCircle, Trash2 } from "lucide-react"
import { socialFetcher, type SocialUser } from "@/components/social/types"

type DM = { id: number; senderId: number; recipientId: number; body: string; createdAt: string }

function Avatar({ user, size = 40 }: { user: SocialUser; size?: number }) {
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatarUrl || "/placeholder.svg"} alt={user.displayName} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="flex items-center justify-center rounded-full bg-emerald-500/20 font-black text-emerald-400" style={{ width: size, height: size }}>
      {user.displayName.charAt(0).toUpperCase()}
    </div>
  )
}

export function ChatPanel({
  activeUser,
  setActiveUser,
  isAdmin,
}: {
  activeUser: SocialUser | null
  setActiveUser: (u: SocialUser | null) => void
  isAdmin: boolean
}) {
  const { data: friendsData } = useSWR("/api/friends", socialFetcher, { refreshInterval: 20000 })
  const friends: { user: SocialUser }[] = friendsData?.friends ?? []

  if (!activeUser) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-2 px-4 py-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Ibiganiro</p>
        {friends.map((f) => (
          <button
            key={f.user.id}
            onClick={() => setActiveUser(f.user)}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-slate-600"
          >
            <Avatar user={f.user} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{f.user.displayName}</p>
              <p className="truncate text-xs text-slate-500">@{f.user.username}</p>
            </div>
            <MessageCircle className="h-4 w-4 text-emerald-400" />
          </button>
        ))}
        {friends.length === 0 ? <p className="text-sm text-slate-500">Ntugira abagenzi bwo kuganira. Genda kuri &quot;Abagenzi&quot; wongere.</p> : null}
      </div>
    )
  }

  return <Thread key={activeUser.id} peer={activeUser} onBack={() => setActiveUser(null)} isAdmin={isAdmin} />
}

function Thread({ peer, onBack, isAdmin }: { peer: SocialUser; onBack: () => void; isAdmin: boolean }) {
  const { data, mutate } = useSWR(`/api/dm?with=${peer.id}`, socialFetcher, { refreshInterval: 4000 })
  const [text, setText] = useState("")
  const messages: DM[] = data?.messages ?? []
  const meId: number | null = data?.me ?? null
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function send() {
    const body = text.trim()
    if (!body) return
    setText("")
    await fetch("/api/dm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ toUserId: peer.id, body }) })
    mutate()
  }

  async function del(id: number) {
    await fetch(`/api/dm?id=${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <button onClick={onBack} className="rounded-full p-1.5 text-slate-300 hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></button>
        <Avatar user={peer} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{peer.displayName}</p>
          <p className="truncate text-xs text-slate-500">@{peer.username}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.senderId === meId
          return (
            <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`relative max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-100"}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                {(mine || isAdmin) && (
                  <button onClick={() => del(m.id)} className="absolute -right-6 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 px-3 py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Andika ubutumwa..."
          className="flex-1 rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button onClick={send} className="rounded-full bg-emerald-500 p-2.5 text-slate-950"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
