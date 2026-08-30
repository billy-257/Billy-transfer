"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MessageSquare, X, Send, Bell, BellRing, CheckCheck, Check } from "lucide-react"
import { enablePush, pushSupported } from "@/lib/push-client"

type Msg = { id: number; sender: "client" | "admin"; body: string; createdAt: string }

function getClientId() {
  let id = localStorage.getItem("billy_client_id")
  if (!id) {
    id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem("billy_client_id", id)
  }
  return id
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function ClientChat({ agentName = "Billy" }: { agentName?: string }) {
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [registered, setRegistered] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [adminOnline, setAdminOnline] = useState(false)
  const [notifOn, setNotifOn] = useState(false)
  const lastIdRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Init identity from localStorage.
  useEffect(() => {
    setClientId(getClientId())
    const n = localStorage.getItem("billy_client_name") ?? ""
    const p = localStorage.getItem("billy_client_phone") ?? ""
    setName(n)
    setPhone(p)
    if (n) setRegistered(true)
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setNotifOn(true)
  }, [])

  const poll = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch(`/api/inbox?clientId=${encodeURIComponent(clientId)}&after=${lastIdRef.current}`)
      const data = await res.json()
      if (data.ok && Array.isArray(data.messages) && data.messages.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          const merged = [...prev, ...data.messages.filter((m: Msg) => !seen.has(m.id))]
          lastIdRef.current = Math.max(lastIdRef.current, ...merged.map((m) => m.id))
          return merged
        })
      }
    } catch {
      /* ignore */
    }
  }, [clientId])

  // Presence heartbeat + admin online status.
  const beat = useCallback(async () => {
    if (!clientId) return
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      setAdminOnline(Boolean(data.adminOnline))
    } catch {
      /* ignore */
    }
  }, [clientId])

  // Poll for messages + presence while the widget is open.
  useEffect(() => {
    if (!open || !clientId) return
    poll()
    beat()
    const t1 = setInterval(poll, 4000)
    const t2 = setInterval(beat, 20000)
    return () => {
      clearInterval(t1)
      clearInterval(t2)
    }
  }, [open, clientId, poll, beat])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  function saveIdentity(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    localStorage.setItem("billy_client_name", name.trim())
    if (phone.trim()) localStorage.setItem("billy_client_phone", phone.trim())
    setRegistered(true)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setDraft("")
    // Optimistic add.
    const optimistic: Msg = { id: -Date.now(), sender: "client", body: text, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, name: name.trim(), phone: phone.trim(), body: text }),
      })
      const data = await res.json()
      if (data.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m)),
        )
        lastIdRef.current = Math.max(lastIdRef.current, data.message.id)
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false)
    }
  }

  async function turnOnNotif() {
    const res = await enablePush("client", clientId)
    setNotifOn(res.ok)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-full bg-red-600 px-6 py-4 font-black text-white shadow-2xl transition hover:bg-red-500"
        >
          <MessageSquare className="h-6 w-6 animate-bounce" />
          <span className="text-sm">Kurungika Message</span>
        </button>
      ) : (
        <div className="flex h-[480px] w-[85vw] max-w-96 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-red-500 bg-slate-800">
                  <img src="/billy-owner.png" alt={agentName} className="h-full w-full object-cover object-top" />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${
                    adminOnline ? "bg-green-500" : "bg-slate-500"
                  }`}
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{agentName} Transfer</h4>
                <p className={`text-[10px] font-semibold ${adminOnline ? "text-green-400" : "text-slate-400"}`}>
                  {adminOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {pushSupported() ? (
                <button
                  onClick={turnOnNotif}
                  className={`rounded-full p-1.5 transition ${
                    notifOn ? "text-emerald-400" : "text-slate-400 hover:text-white"
                  }`}
                  aria-label="Emera integuza"
                  title="Emera integuza"
                >
                  {notifOn ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </button>
              ) : null}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white" aria-label="Funga">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!registered ? (
            /* Intro form: capture name + WhatsApp number */
            <form onSubmit={saveIdentity} className="flex flex-1 flex-col justify-center gap-3 px-5">
              <p className="text-center text-sm font-bold text-white">Twandikire</p>
              <p className="text-center text-xs text-slate-400">
                Andika izina na numero ya WhatsApp kugira {agentName} aksubize.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Izina ryawe"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="Numero ya WhatsApp (+257...)"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                Tangura kuvugana
              </button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-900/50 p-4 text-xs">
                {messages.length === 0 ? (
                  <p className="pt-6 text-center text-slate-400">
                    Muraho {name}! Twandikire ubutumwa, {agentName} araza kubisubiza.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.sender === "client" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                          m.sender === "client"
                            ? "rounded-br-sm bg-red-600 text-white"
                            : "rounded-bl-sm border border-slate-700 bg-slate-800 text-slate-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <div className="mt-1 flex justify-end gap-1 text-[9px] opacity-75">
                          <span>{m.id > 0 ? fmtTime(m.createdAt) : "..."}</span>
                          {m.sender === "client" ? (
                            m.id > 0 ? (
                              <CheckCheck className="inline h-3 w-3 text-blue-200" />
                            ) : (
                              <Check className="inline h-3 w-3" />
                            )
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <form onSubmit={send} className="flex gap-2 border-t border-slate-800 bg-slate-950 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Andika ubutumwa..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="rounded-xl bg-red-600 p-2.5 text-white transition hover:bg-red-500 disabled:opacity-50"
                  aria-label="Ohereza"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
