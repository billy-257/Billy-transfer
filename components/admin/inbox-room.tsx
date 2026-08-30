"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Send, ArrowLeft, Bell, BellRing, Trash2, Phone } from "lucide-react"
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
  online?: boolean
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
      // Fetching also registers the admin as online (server heartbeat).
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
    // Poll every 4s: keeps admin online, refreshes list + open thread.
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

  async function deleteMessage(id: number) {
    if (!activeId) return
    setThread((prev) => prev.filter((m) => m.id !== id))
    try {
      await fetch(`/api/admin/inbox?conversationId=${activeId}&messageId=${id}`, { method: "DELETE" })
    } catch {
      /* ignore */
    }
  }

  async function deleteConversation(id: number) {
    if (!confirm("Ushaka gusiba iyi ntumwa yose? Ntushobora kuyisubiza.")) return
    setConvos((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) setActiveId(null)
    try {
      await fetch(`/api/admin/inbox?conversationId=${id}`, { method: "DELETE" })
    } catch {
      /* ignore */
    }
  }

  async function enableAdminNotif() {
    const res = await enablePush("admin")
    setNotifState(res.ok ? "on" : "off")
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
              <div
                key={c.id}
                className="group flex items-center justify-between border-b border-slate-800/60 px-4 py-3 transition hover:bg-slate-900"
              >
                <button onClick={() => setActiveId(c.id)} className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${c.online ? "bg-emerald-400" : "bg-slate-600"}`}
                        aria-hidden
                      />
                      {c.name || "Umukiriya"}
                    </span>
                    {c.phone ? <span className="text-xs font-normal text-slate-400">{c.phone}</span> : null}
                    {c.unreadForAdmin > 0 ? (
                      <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-950">
                        {c.unreadForAdmin}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {c.online ? <span className="text-emerald-400">ari kumurongo · </span> : null}
                    {c.lastBody}
                  </p>
                </button>
                <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                  {c.phone ? (
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full p-1.5 text-emerald-400 hover:bg-emerald-500/10"
                      aria-label="WhatsApp"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  ) : null}
                  <span className="text-xs text-slate-500">{timeAgo(c.lastMessageAt)}</span>
                  <button
                    onClick={() => deleteConversation(c.id)}
                    className="rounded-full p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    aria-label="Siba intumwa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex h-[28rem] flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveId(null)} className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <span
                    className={`h-2 w-2 rounded-full ${active?.online ? "bg-emerald-400" : "bg-slate-600"}`}
                    aria-hidden
                  />
                  {active?.name || "Umukiriya"}
                </p>
                <p className="text-xs text-slate-400">
                  {active?.online ? "ari kumurongo" : "ntari kumurongo"}
                  {active?.phone ? ` · ${active.phone}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {active?.phone ? (
                <a
                  href={`https://wa.me/${active.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 text-emerald-400 hover:bg-emerald-500/10"
                  aria-label="WhatsApp"
                >
                  <Phone className="h-4 w-4" />
                </a>
              ) : null}
              <button
                onClick={() => deleteConversation(active!.id)}
                className="rounded-full p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                aria-label="Siba intumwa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {thread.map((m) => (
              <div key={m.id} className={`group flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                {m.sender === "admin" ? (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="mr-1 self-center rounded-full p-1 text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    aria-label="Siba ubutumwa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.sender === "admin"
                      ? "rounded-br-sm bg-emerald-600 text-white"
                      : "rounded-bl-sm bg-slate-800 text-slate-100"
                  }`}
                >
                  {m.body}
                </div>
                {m.sender === "client" ? (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="ml-1 self-center rounded-full p-1 text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    aria-label="Siba ubutumwa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
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
