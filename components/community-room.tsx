"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Users, Send, ChevronUp } from "lucide-react"

type Msg = { id: number; clientId: string | null; name: string; body: string; createdAt: string }

const NAME_KEY = "billy_room_name"
const CID_KEY = "billy_client_id"

function timeShort(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

// Stable per-device id so a member's own bubbles align right (kept across visits).
function getClientId() {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem(CID_KEY)
  if (!id) {
    id = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(CID_KEY, id)
  }
  return id
}

export function CommunityRoom({ variant = "inline" }: { variant?: "inline" | "page" }) {
  const isPage = variant === "page"
  const [name, setName] = useState("")
  const [registered, setRegistered] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = useRef("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(0)
  const firstIdRef = useRef(0)
  const shouldStickRef = useRef(true)

  useEffect(() => {
    clientId.current = getClientId()
    const saved = localStorage.getItem(NAME_KEY)
    if (saved) {
      setName(saved)
      setRegistered(true)
    }
  }, [])

  function trackScroll() {
    const el = scrollRef.current
    if (!el) return
    // Stick to bottom only when the user is already near the bottom.
    shouldStickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  const poll = useCallback(async () => {
    try {
      const url = lastIdRef.current > 0 ? `/api/room?after=${lastIdRef.current}` : "/api/room"
      const res = await fetch(url)
      const data = await res.json()
      if (!data.ok || !Array.isArray(data.messages)) return
      if (lastIdRef.current === 0) {
        setMessages(data.messages)
        setHasMore(data.messages.length >= 40)
        if (data.messages.length) {
          firstIdRef.current = data.messages[0].id
          lastIdRef.current = data.messages[data.messages.length - 1].id
        }
        setLoaded(true)
      } else if (data.messages.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          const added = data.messages.filter((m: Msg) => !seen.has(m.id))
          if (!added.length) return prev
          return [...prev, ...added]
        })
        lastIdRef.current = data.messages[data.messages.length - 1].id
      }
    } catch {
      /* ignore transient network errors */
    }
  }, [])

  // Everyone can read the room right away; polling runs whether or not they've
  // entered a name. The name is only required to post a message.
  useEffect(() => {
    poll()
    const t = setInterval(poll, 4000)
    return () => clearInterval(t)
  }, [poll])

  useEffect(() => {
    if (shouldStickRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }
  }, [messages])

  async function loadOlder() {
    if (loadingMore || !firstIdRef.current) return
    setLoadingMore(true)
    const el = scrollRef.current
    const prevHeight = el?.scrollHeight ?? 0
    try {
      const res = await fetch(`/api/room?before=${firstIdRef.current}`)
      const data = await res.json()
      if (data.ok && Array.isArray(data.messages) && data.messages.length) {
        firstIdRef.current = data.messages[0].id
        setMessages((prev) => [...data.messages, ...prev])
        setHasMore(data.messages.length >= 40)
        // Preserve scroll position after prepending older messages.
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevHeight
        })
      } else {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  function join(e: React.FormEvent) {
    e.preventDefault()
    const n = nameInput.trim().slice(0, 40)
    if (n.length < 2) return
    localStorage.setItem(NAME_KEY, n)
    setName(n)
    setRegistered(true)
  }

  async function send() {
    const body = text.trim()
    if (!body || sending) return
    setError(null)
    setSending(true)
    // Optimistic bubble.
    const optimistic: Msg = {
      id: -Date.now(),
      clientId: clientId.current,
      name,
      body,
      createdAt: new Date().toISOString(),
    }
    shouldStickRef.current = true
    setMessages((prev) => [...prev, optimistic])
    setText("")
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId: clientId.current, name, body }),
      })
      const data = await res.json()
      if (data.ok && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)))
        lastIdRef.current = Math.max(lastIdRef.current, data.message.id)
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        setError(data.error ?? "Ntibishoboka")
        setText(body)
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setError("Habaye ikibazo, gerageza kandi")
      setText(body)
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Respect CJK IME composition; Safari reports 229 while composing.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter") {
      e.preventDefault()
      send()
    }
  }

  return (
    <section
      id="room"
      aria-labelledby="room-title"
      className={
        isPage
          ? "flex flex-1 min-h-0 flex-col bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl"
          : "bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl"
      }
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 id="room-title" className="text-base md:text-lg font-black text-emerald-400 tracking-wide uppercase">
          IKIBANZA CO KUGANIRIRAMWO
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
          <Users className="w-3.5 h-3.5" />
          Abanywanyi bose
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-5 leading-5">
        Ganira n&apos;abandi banywanyi. Vuga uko ubona app, ico ukunze n&apos;ivyo dushobora kuryoza. Ubutumwa
        bwose bubikwa, uzobubona n&apos;igihe woshira app kuva mu mbuga uce uyisubizamwo.
      </p>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={trackScroll}
        className={`overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-3 flex flex-col gap-3 ${
          isPage ? "flex-1 min-h-0" : "h-80"
        }`}
      >
        {hasMore ? (
          <button
            type="button"
            onClick={loadOlder}
            disabled={loadingMore}
            className="mx-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition disabled:opacity-60"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            {loadingMore ? "Birimwo kuza..." : "Raba ubutumwa bwahavuye"}
          </button>
        ) : null}

        {!loaded ? (
          <p className="m-auto text-sm text-slate-500">Birimwo kuza...</p>
        ) : messages.length === 0 ? (
          <div className="m-auto flex flex-col items-center gap-2 text-slate-500">
            <Users className="w-8 h-8" />
            <p className="text-sm">Ba uwa mbere kuvuga ikintu!</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.clientId && m.clientId === clientId.current
            return (
              <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                <div
                  aria-hidden
                  className={`w-8 h-8 rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0 ${
                    mine
                      ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-300"
                      : "bg-slate-700/40 border border-slate-600 text-slate-300"
                  }`}
                >
                  {initials(m.name)}
                </div>
                <div className={`min-w-0 max-w-[78%] ${mine ? "items-end text-right" : ""} flex flex-col`}>
                  <div className={`flex items-baseline gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    <span className="text-xs font-bold text-white truncate">{mine ? "Wewe" : m.name}</span>
                    <time dateTime={m.createdAt} className="text-[10px] text-slate-500 whitespace-nowrap">
                      {timeShort(m.createdAt)}
                    </time>
                  </div>
                  <div
                    className={`mt-1 rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      mine
                        ? "bg-emerald-600 text-white rounded-tr-sm"
                        : "bg-slate-800 text-slate-200 rounded-tl-sm"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer / name gate */}
      {registered ? (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={1000}
              placeholder="Andika ubutumwa..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !text.trim()}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-sm px-4 py-2.5 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Rungika</span>
            </button>
          </div>
          <p className="mt-1.5 text-[11px] min-h-4 flex items-center justify-between gap-2">
            <span className="text-slate-500">
              Uganira nka <span className="font-bold text-slate-300">{name}</span>
            </span>
            {error ? <span className="text-red-400">{error}</span> : null}
          </p>
        </div>
      ) : (
        <form onSubmit={join} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={40}
            required
            placeholder="Andika izina ryawe kugira winjire"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm px-5 py-2.5 rounded-xl transition"
          >
            <Users className="w-4 h-4" />
            Injira
          </button>
        </form>
      )}
    </section>
  )
}
