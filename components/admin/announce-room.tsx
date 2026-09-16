"use client"

import { useState } from "react"
import { Megaphone, Send, CheckCircle2, Loader2 } from "lucide-react"

export function AnnounceRoom() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!body.trim() || sending) return
    setSending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/announce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult({ sent: data.sent })
        setTitle("")
        setBody("")
      } else {
        setError(data.error ?? "Ntibishoboye")
      }
    } catch {
      setError("Habaye ikibazo, gerageza kandi")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Tanga itangazo (push)</h2>
      </div>
      <p className="text-sm text-slate-400">
        Andika itangazo, rihita rigenda kuri telefone z&apos;abakiriya bose bemeye integuza (notifications) ako
        kanya.
      </p>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <label htmlFor="a-title" className="mb-1.5 block text-sm font-bold text-white">
          Umutwe (Title)
        </label>
        <input
          id="a-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Urf. Igiciro gishasha!"
          className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />

        <label htmlFor="a-body" className="mb-1.5 block text-sm font-bold text-white">
          Itangazo
        </label>
        <textarea
          id="a-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={300}
          rows={4}
          placeholder="Andika ubutumwa ushaka gutangaza..."
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-slate-500">{body.length}/300</p>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {result ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Itangazo ryagiye kuri telefone {result.sent}!
        </p>
      ) : null}

      <button
        onClick={send}
        disabled={sending || !body.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Turimo kurungika..." : "Rungika kuri bose"}
      </button>
    </div>
  )
}
