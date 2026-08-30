"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Send, Bell, BellRing, MessagesSquare } from "lucide-react"
import { enablePush, pushSupported } from "@/lib/push-client"

type Msg = { id: number; sender: "client" | "admin"; body: string; createdAt: string }

function getClientId() {
  let id = localStorage.getItem("billy_client_id")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("billy_client_id", id)
  }
  return id
}

export function ClientInbox({ agentName }: { agentName: string }) {
  const [clientId, setClientId] = useState<string>("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [notifState, setNotifState] = useState<"idle" | "on" | "off">("idle")
  const lastIdRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = getClientId()
    setClientId(id)
    setName(localStorage.getItem("billy_client_name") ?? "")
    setPhone(localStorage.getItem("billy_client_phone") ?? "")
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setNotifState("on")
  }, [])

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/inbox?clientId=${encodeURIComponent(id)}&after=${lastIdRef.current}`)
      const data = await res.json()
      if (data.ok && Array.isArray(data.messages) && data.messages.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          const merged = [...prev]
          for (const m of data.messages as Msg[]) if (!seen.has(m.id)) merged.push(m)
          return merged
        })
        lastIdRef.current = Math.max(lastIdRef.current, ...data.messages.map((m: Msg) => m.id))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!clientId) return
    poll(clientId)
    const t = setInterval(() => poll(clientId), 4000)
    return () => clearInterval(t)
  }, [clientId, poll])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function send() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    if (name) localStorage.setItem("billy_client_name", name)
    if (phone) localStorage.setItem("billy_client_phone", phone)
    // Optimistic append.
    const optimistic: Msg = { id: -Date.now(), sender: "client", body: text, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    setDraft("")
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, name, phone, body: text }),
      })
      const data = await res.json()
      if (data.ok && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)))
        lastIdRef.current = Math.max(lastIdRef.current, data.message.id)
        // Auto-enable notifications on first send so replies reach the user.
        if (notifState === "idle" && pushSupported()) {
          const ok = await enablePush("client", clientId)
          setNotifState(ok ? "on" : "off")
        }
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false)
    }
  }

  async function toggleNotif() {
    const ok = await enablePush("client", clientId)
    setNotifState(ok ? "on" : "off")
  }

  return (
    <section className="rounded-2xl border border-emerald-500/40 bg-slate-900 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <MessagesSquare className="h-5 w-5 text-emerald-400" />
          <span>Twandikire ubu nyene &middot; {agentName}</span>
        </h3>
        <button
          onClick={toggleNotif}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            notifState === "on"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
          }`}
          title="Emera kumenyeshwa"
        >
          {notifState === "on" ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {notifState === "on" ? "Turagukurikiranira" : "Emera kumenyeshwa"}
        </button>
      </div>

      <div ref={scrollRef} className="max-h-72 min-h-[8rem] space-y-2 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Andika ubutumwa bwawe hano. Uwurungika azakwishura ako kanya.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "client" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.sender === "client"
                    ? "rounded-br-sm bg-emerald-600 text-white"
                    : "rounded-bl-sm bg-slate-800 text-slate-100"
                }`}
              >
                {m.body}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="mb-2 grid grid-cols-2 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amazina yawe (optional)"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Numero yawe (optional)"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder="Andika ubutumwa..."
            className="max-h-28 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-50"
            aria-label="Ohereza"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
