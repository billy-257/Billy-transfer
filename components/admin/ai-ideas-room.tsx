"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  Wifi,
  WifiOff,
  GitBranch,
  GitMerge,
  ExternalLink,
  Trash2,
  Rocket,
  AlertTriangle,
} from "lucide-react"

type Idea = {
  title: string
  summaryKirundi: string
  features: string[]
  questions: string[]
  buildPrompt: string
}

type ApplyResult = {
  applied: boolean
  mode?: "pr" | "direct"
  branch?: string
  commitUrl?: string
  pr?: { number: number; html_url: string } | null
  files?: string[]
  summaryKirundi: string
  sql?: string
}

type PrList = {
  ok: boolean
  configured: boolean
  repo?: string
  error?: string
  prs: { number: number; title: string; url: string; createdAt: string }[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AiIdeasRoom() {
  // --- Apply changes through GitHub ---
  const [instruction, setInstruction] = useState("")
  const [mode, setMode] = useState<"pr" | "direct">("pr")
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState("")
  const [result, setResult] = useState<ApplyResult | null>(null)
  const [busyPr, setBusyPr] = useState<number | null>(null)

  const { data: prData, mutate: refreshPrs } = useSWR<PrList>("/api/admin/ai-prs", fetcher, {
    refreshInterval: 30000,
  })

  // --- Plan only (copy a prompt for v0) ---
  const [wish, setWish] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [idea, setIdea] = useState<Idea | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPlanner, setShowPlanner] = useState(false)

  const { data: status, isLoading: statusLoading } = useSWR<{ ok: boolean; error?: string }>(
    "/api/admin/ai-status",
    fetcher,
    { revalidateOnFocus: false },
  )

  async function apply(e: React.FormEvent) {
    e.preventDefault()
    if (instruction.trim().length < 3 || applying) return
    if (mode === "direct" && !confirm("Ihinduka rizoshirwa kuri main ubu nyene rikaja live. Urabiremeza?")) return
    setApplying(true)
    setApplyError("")
    setResult(null)
    try {
      const res = await fetch("/api/admin/ai-apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction: instruction.trim(), mode }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || "Habaye ikibazo")
      setResult(data)
      if (data.applied) setInstruction("")
      refreshPrs()
    } catch (err) {
      setApplyError((err as Error).message)
    } finally {
      setApplying(false)
    }
  }

  async function prAction(number: number, action: "merge" | "close") {
    if (action === "close" && !confirm("Guta iri hinduka?")) return
    setBusyPr(number)
    try {
      const res = await fetch("/api/admin/ai-prs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number, action }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || "Habaye ikibazo")
      if (result?.pr?.number === number) setResult(null)
      refreshPrs()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusyPr(null)
    }
  }

  async function submitPlan(e: React.FormEvent) {
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

  const githubReady = prData?.configured !== false

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

      {/* GitHub not configured */}
      {prData && !githubReady ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            GitHub ntiraboneka: shira <span className="font-mono font-bold">GITHUB_TOKEN</span> muri Vercel (Settings
            &gt; Environment Variables) hanyuma usubize gukora deploy. AI izoshobora guhindura app ivyo ubwiye.
          </p>
        </div>
      ) : null}

      {/* Apply change */}
      <form onSubmit={apply} className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
          <Rocket className="h-4 w-4 text-emerald-400" /> Bwira AI ihindure app (GitHub)
        </h3>
        <p className="mb-4 text-xs leading-5 text-slate-400">
          Andika ico ushaka ko gihinduka. AI isoma code kuri GitHub, irahindura, hanyuma ibishira mu repo yawe.
          Vercel irakora deploy yonyene.
        </p>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={4}
          disabled={applying || !githubReady}
          placeholder="Urugero: Hindura ibara ry'akabuto ka WhatsApp kabe icatsi kibisi, kandi wongere umurongo 'Turakora 24/7' munsi y'igiciro..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode("pr")}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
              mode === "pr"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                : "border-slate-700 bg-slate-900 text-slate-400"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" /> Ndabanza kubireba (PR)
          </button>
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
              mode === "direct"
                ? "border-red-500 bg-red-500/10 text-red-300"
                : "border-slate-700 bg-slate-900 text-slate-400"
            }`}
          >
            <Rocket className="h-3.5 w-3.5" /> Shira live ubu nyene
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          {applyError ? <p className="text-xs text-red-400">{applyError}</p> : <span />}
          <button
            type="submit"
            disabled={applying || !githubReady || instruction.trim().length < 3}
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {applying ? "AI iriko irahindura (iminota 1-3)..." : "Hindura"}
          </button>
        </div>
      </form>

      {/* Apply result */}
      {result ? (
        <div
          className={`space-y-3 rounded-2xl border p-5 ${
            result.applied ? "border-emerald-500/30 bg-slate-950" : "border-amber-500/30 bg-amber-500/5"
          }`}
        >
          <p className="text-sm leading-6 text-slate-100">{result.summaryKirundi}</p>

          {result.applied && result.files?.length ? (
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Files zahinduwe</p>
              <ul className="space-y-0.5 font-mono text-[11px] text-slate-300">
                {result.files.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.sql ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-300">
                SQL yo gukoresha muri database
              </p>
              <pre className="overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-5 text-amber-100">
                {result.sql}
              </pre>
            </div>
          ) : null}

          {result.applied ? (
            result.mode === "direct" ? (
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Check className="h-4 w-4" /> Vyashizwe kuri main. Vercel iriko irakora deploy (iminota 1-2).
                {result.commitUrl ? (
                  <a href={result.commitUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Raba commit
                  </a>
                ) : null}
              </p>
            ) : result.pr ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busyPr === result.pr.number}
                  onClick={() => prAction(result.pr!.number, "merge")}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {busyPr === result.pr.number ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitMerge className="h-4 w-4" />
                  )}
                  Emeza ushire live
                </button>
                <a
                  href={result.pr.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 hover:border-emerald-500"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Raba kuri GitHub
                </a>
                <button
                  type="button"
                  disabled={busyPr === result.pr.number}
                  onClick={() => prAction(result.pr!.number, "close")}
                  className="flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Ta
                </button>
              </div>
            ) : null
          ) : null}
        </div>
      ) : null}

      {/* Pending AI changes */}
      {prData?.prs?.length ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <GitBranch className="h-4 w-4 text-emerald-400" /> Ihinduka zitegereje kwemezwa
          </h4>
          <div className="space-y-2">
            {prData.prs.map((pr) => (
              <div
                key={pr.number}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{pr.title}</p>
                  <p className="text-[11px] text-slate-500">
                    #{pr.number} · {new Date(pr.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Raba kuri GitHub"
                    className="rounded-full border border-slate-700 p-2 text-slate-300 hover:border-emerald-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    disabled={busyPr === pr.number}
                    onClick={() => prAction(pr.number, "close")}
                    aria-label="Ta"
                    className="rounded-full border border-red-500/40 p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busyPr === pr.number}
                    onClick={() => prAction(pr.number, "merge")}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {busyPr === pr.number ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <GitMerge className="h-3.5 w-3.5" />
                    )}
                    Emeza
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Planner (prompt for v0) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <button
          type="button"
          onClick={() => setShowPlanner((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="h-4 w-4 text-slate-400" /> Tegura umugambi gusa (kuri v0)
          </span>
          <span className="text-xs text-slate-500">{showPlanner ? "Hisha" : "Erekana"}</span>
        </button>

        {showPlanner ? (
          <form onSubmit={submitPlan} className="mt-4">
            <p className="mb-3 text-xs leading-5 text-slate-400">
              Ku bintu binini cane, AI itegura umugambi n&apos;&quot;build prompt&quot; ukopora ushire muri v0.
            </p>
            <textarea
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              rows={3}
              placeholder="Urugero: Nshaka ko abakiriya bashobora kubona aho amafaranga yabo ageze (tracking)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              {error ? <p className="text-xs text-red-400">{error}</p> : <span />}
              <button
                type="submit"
                disabled={loading || wish.trim().length < 3}
                className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900 px-5 py-2 text-xs font-bold text-slate-100 transition hover:border-emerald-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "AI iriko irategura..." : "Tegura umugambi"}
              </button>
            </div>

            {idea ? (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <h4 className="text-sm font-black text-white">{idea.title}</h4>
                {idea.summaryKirundi ? <p className="text-xs leading-5 text-slate-200">{idea.summaryKirundi}</p> : null}
                {idea.features.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-slate-300">
                    {idea.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : null}
                {idea.questions.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-amber-200">
                    {idea.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                ) : null}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Build prompt</p>
                    <button
                      type="button"
                      onClick={copyPrompt}
                      className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-500"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Byakoporowe" : "Kopora"}
                    </button>
                  </div>
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-200">
                    {idea.buildPrompt}
                  </pre>
                </div>
              </div>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  )
}
