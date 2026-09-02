"use client"

import { useState } from "react"
import useSWR from "swr"
import { MessageSquareHeart, Send, ChevronDown } from "lucide-react"

type Item = { id: number; name: string; comment: string; createdAt: string }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "ubu nyene"
  const m = Math.floor(s / 60)
  if (m < 60) return `iminota ${m} iheze`
  const h = Math.floor(m / 60)
  if (h < 24) return `amasaha ${h} aheze`
  const d = Math.floor(h / 24)
  if (d < 30) return `iminsi ${d} iheze`
  return new Date(iso).toLocaleDateString("fr-FR")
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function FeedbackSection() {
  const { data, mutate } = useSWR<{ ok: boolean; items: Item[]; total: number }>("/api/feedback", fetcher, {
    revalidateOnFocus: false,
  })
  const [older, setOlder] = useState<Item[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [name, setName] = useState("")
  const [comment, setComment] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const first = data?.items ?? []
  const items = [...first, ...older]
  const total = data?.total ?? 0
  const hasMore = items.length < total

  async function loadMore() {
    const last = items[items.length - 1]
    if (!last || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/feedback?before=${last.id}`)
      const json = await res.json()
      if (json.ok) setOlder((prev) => [...prev, ...json.items])
    } finally {
      setLoadingMore(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    setError(null)
    setSending(true)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, comment }),
      })
      const json = await res.json()
      if (!json.ok) {
        setError(json.error ?? "Habaye ikibazo")
        return
      }
      // Show the new comment at the top right away.
      mutate(
        (prev) => ({
          ok: true,
          items: [json.item, ...(prev?.items ?? [])],
          total: (prev?.total ?? 0) + 1,
        }),
        { revalidate: false },
      )
      setComment("")
      setDone(true)
      setTimeout(() => setDone(false), 4000)
    } catch {
      setError("Habaye ikibazo, gerageza kandi")
    } finally {
      setSending(false)
    }
  }

  return (
    <section
      id="feedback"
      aria-labelledby="feedback-title"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 id="feedback-title" className="text-base md:text-lg font-black text-red-400 tracking-wide uppercase">
          IVYO ABAKIRIYA BAVUGA
        </h3>
        <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
          {total.toLocaleString()} {total === 1 ? "comment" : "comments"}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-5 leading-5">
        Vuga uko transaction yawe yagenze n&apos;ico wakunze cane. Izina ryawe gusa ni ryo rigaragara; nta numero
        isabwa.
      </p>

      {/* Form */}
      <form onSubmit={submit} className="flex flex-col gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Izina ryawe</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            placeholder="Nk: Aline N."
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ico wiyumvira</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={600}
            required
            rows={3}
            placeholder="Transaction yagenze gute? Ni iki wakunze cane?"
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs min-h-4" role="status">
            {error ? <span className="text-red-400">{error}</span> : null}
            {done ? <span className="text-emerald-400">Urakoze! Comment yawe yashizweho.</span> : null}
          </p>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-black text-sm px-4 py-2.5 rounded-xl transition"
          >
            <Send className="w-4 h-4" />
            {sending ? "Birarungikwa..." : "Rungika"}
          </button>
        </div>
      </form>

      {/* List */}
      {!data ? (
        <p className="text-center text-sm text-slate-500 py-6">Birimwo kuza...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
          <MessageSquareHeart className="w-8 h-8" />
          <p className="text-sm">Ba uwa mbere gusiga comment!</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.id} className="flex gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div
                aria-hidden
                className="w-9 h-9 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-black flex items-center justify-center flex-shrink-0"
              >
                {initials(it.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-white truncate">{it.name}</p>
                  <time dateTime={it.createdAt} className="text-[11px] text-slate-500 whitespace-nowrap">
                    {timeAgo(it.createdAt)}
                  </time>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mt-1 whitespace-pre-wrap break-words">
                  {it.comment}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-60"
        >
          <ChevronDown className="w-4 h-4" />
          {loadingMore ? "Birimwo kuza..." : `Raba izindi (${(total - items.length).toLocaleString()})`}
        </button>
      ) : null}
    </section>
  )
}
