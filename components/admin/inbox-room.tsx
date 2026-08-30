"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Send, ArrowLeft, Bell, BellRing } from "lucide-react"
import { enablePush, pushSupported } from "@/lib/push-client"

type Convo = {
  id: number
  clientId: string
  name: string | null
  phone: string | null
  lastMessageAt: string
  unreadForAdmin: number
  lastBody: string | null
  total: number
}
type Msg = { id: number; sender: "client" | "admin"; body: string; createdAt: string }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ubu"
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function InboxRoom() {
  const [convos, setConvos] = useState<Convo[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [thread, setThread] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [notifState, setNotifState] = useState<"idle" | "on" | "off">("idle")
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<number | null>(null)
  activeRef.current = activeId

  const loadConvos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inbox")
      const data = await res.json()
      if (data.ok) setConvos(data.conversations)
    } catch {
      /* ignore */
    }
  }, [])

  const loadThread = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/admin/inbox?conversationId=${id}`)
      const data = await res.json()
      if (data.ok) setThread(data.messages)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setNotifState("on")
    loadConvos()
    const t = setInterval(() => {
      loadConvos()
      if (activeRef.current) loadThread(activeRef.current)
    }, 4000)
    return () => clearInterval(t)
  }, [loadConvos, loadThread])

  useEffect(() => {
    if (activeId) loadThread(activeId)
  }, [activeId, loadThread])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [thread])

  async function reply() {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    setDraft("")
    try {
      const res = await fetch("/api/admin/inbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, body: text }),
      })
      const data = await res.json()
      if (data.ok && data.message) setThread((prev) => [...prev, data.message])
    } catch {
      /* ignore */
    } finally {
      setSending(false)
    }
  }

  async function enableAdminNotif() {
    const ok = await enablePush("admin")
    setNotifState(ok ? "on" : "off")
  }

  const active = convos.find((c) => c.id === activeId)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h4 className="text-sm font-bold text-white">Ubutumwa bw&apos;abakiriya</h4>
        <button
          onClick={enableAdminNotif}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            notifState === "on"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
          }`}
          disabled={!pushSupported() && notifState !== "on"}
        >
          {notifState === "on" ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {notifState === "on" ? "Amamenyesha arafunguye" : "Emera amamenyesha"}
        </button>
      </div>

      {!activeId ? (
        <div className="max-h-[28rem] overflow-y-auto">
          {convos.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Nta butumwa buraboneka.</p>
          ) : (
            convos.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="flex w-full items-center justify-between border-b border-slate-800/60 px-4 py-3 text-left transition hover:bg-slate-900"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    {c.name || "Umukiriya"}
                    {c.phone ? <span className="text-xs font-normal text-slate-400">{c.phone}</span> : null}
                    {c.unreadForAdmin > 0 ? (
                      <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-950">
                        {c.unreadForAdmin}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-slate-400">{c.lastBody}</p>
                </div>
                <span className="ml-2 flex-shrink-0 text-xs text-slate-500">{timeAgo(c.lastMessageAt)}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex h-[28rem] flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
            <button onClick={() => setActiveId(null)} className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-bold text-white">{active?.name || "Umukiriya"}</p>
              {active?.phone ? <p className="text-xs text-slate-400">{active.phone}</p> : null}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {thread.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.sender === "admin"
                      ? "rounded-br-sm bg-emerald-600 text-white"
                      : "rounded-bl-sm bg-slate-800 text-slate-100"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2 border-t border-slate-800 px-4 py-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  reply()
                }
              }}
              rows={1}
              placeholder="Andika igisubizo..."
              className="max-h-28 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={reply}
              disabled={sending || !draft.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-50"
              aria-label="Ohereza"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
