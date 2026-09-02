"use client"

import { useState } from "react"
import useSWR from "swr"
import { Sparkles, Copy, Check, Loader2, Wifi, WifiOff } from "lucide-react"

type Idea = {
  title: string
  summaryKirundi: string
  features: string[]
  questions: string[]
  buildPrompt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AiIdeasRoom() {
  const [wish, setWish] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [idea, setIdea] = useState<Idea | null>(null)
  const [copied, setCopied] = useState(false)

  // Live check that the AI model works from this deployment (the same one the chat uses).
  const { data: status, isLoading: statusLoading } = useSWR<{ ok: boolean; error?: string }>(
    "/api/admin/ai-status",
    fetcher,
    { revalidateOnFocus: false },
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (wish.trim().length < 3 || loading) return
    setLoading(true)
    setError("")
    setIdea(null)
    try {
      const res = await fetch("/api/admin/ai-ideas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ request: wish.trim() }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || "Habaye ikibazo")
      setIdea(data.idea)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function copyPrompt() {
    if (!idea) return
    await navigator.clipboard.writeText(idea.buildPrompt).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* AI status */}
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${
          statusLoading
            ? "border-slate-800 bg-slate-950 text-slate-400"
            : status?.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
        }`}
      >
        {statusLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status?.ok ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        {statusLoading
          ? "Turiko turagerageza AI..."
          : status?.ok
            ? "AI y'ubutumwa (customer care) irakora neza."
            : `AI ntirakora: ${status?.error ?? "ikibazo kitazwi"}. Abakiriya baronka inyishu y'ibiciro gusa.`}
      </div>

      {/* Request form */}
      <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
          <Sparkles className="h-4 w-4 text-emerald-400" /> Saba AI ikintu gishasha
        </h3>
        <p className="mb-4 text-xs leading-5 text-slate-400">
          Andika ico ushaka ko app ikora (mu Kirundi, Igifaransa canke Icongereza). AI izobitegura ibe
          umugambi, hanyuma ukopore &quot;build prompt&quot; uyishire muri v0 kugira bihinduke ubu nyene.
        </p>
        <textarea
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          rows={4}
          placeholder="Urugero: Nshaka ko abakiriya bashobora kubona aho amafaranga yabo ageze (tracking)..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          {error ? <p className="text-xs text-red-400">{error}</p> : <span />}
          <button
            type="submit"
            disabled={loading || wish.trim().length < 3}
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "AI iriko irategura..." : "Tegura umugambi"}
          </button>
        </div>
      </form>

      {/* Result */}
      {idea ? (
        <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-slate-950 p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-400">Umugambi</p>
            <h4 className="text-base font-black text-white">{idea.title}</h4>
          </div>

          {idea.summaryKirundi ? (
            <p className="text-sm leading-6 text-slate-200">{idea.summaryKirundi}</p>
          ) : null}

          {idea.features.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-slate-300">
              {idea.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : null}

          {idea.questions.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-300">Ibibazo</p>
              <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-amber-100">
                {idea.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Build prompt (kopora ushire muri v0)
              </p>
              <button
                type="button"
                onClick={copyPrompt}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-bold text-slate-200 transition hover:border-emerald-500"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Byakoporowe" : "Kopora"}
              </button>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs leading-5 text-slate-200">
              {idea.buildPrompt}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  )
}
