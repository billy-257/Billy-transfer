"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Send, Loader2, Undo2, Sparkles, Gift } from "lucide-react"
import { runAssistantCommand, runAssistantRevert, type AssistantResponse } from "@/app/admin/assistant-actions"
import type { Action } from "@/lib/ai-command"

type Msg = {
  id: number
  role: "user" | "assistant"
  text: string
  changed?: boolean
  revert?: Action | null
}

const SUGGESTIONS = [
  "igiciro 6030",
  "igiciro ca banki 5900",
  "add country Zambia code ZMW rate 400",
  "Uganda rate 10500",
  "add bank BancABC",
  "add fee 1500 = 6",
  "add announcement Turakora 24/7",
  "change tagline to Twohereza amafaranga vuba",
]

let idc = 1

export function AiAssistantRoom() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: idc++,
      role: "assistant",
      text: "Bwakiriwe! Ndi umufasha wawe. Mbwira ico ushaka ko gihinduka mu app, nkagihindura ubu nyene ku buntu. Urugero: \"igiciro 6030\" canke \"add bank BancABC\". Andika \"help\" kugira ubone ibindi.",
    },
  ])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, busy])

  async function send(text: string) {
    const value = text.trim()
    if (!value || busy) return
    setInput("")
    setMessages((m) => [...m, { id: idc++, role: "user", text: value }])
    setBusy(true)
    let res: AssistantResponse
    try {
      res = await runAssistantCommand(value)
    } catch {
      res = { ok: false, reply: "Habaye ikibazo. Gerageza kandi." }
    }
    setMessages((m) => [
      ...m,
      { id: idc++, role: "assistant", text: res.reply, changed: res.changed, revert: res.revert ?? null },
    ])
    setBusy(false)
  }

  async function undo(revert: Action, msgId: number) {
    if (busy) return
    setBusy(true)
    // Remove the undo affordance from the message being reverted.
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, revert: null } : x)))
    let res: AssistantResponse
    try {
      res = await runAssistantRevert(revert)
    } catch {
      res = { ok: false, reply: "Habaye ikibazo mu gusubiza inyuma." }
    }
    setMessages((m) => [
      ...m,
      { id: idc++, role: "assistant", text: res.reply, changed: res.changed, revert: res.revert ?? null },
    ])
    setBusy(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <Bot className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-black text-white">
            Umufasha AI
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <Gift className="h-3 w-3" /> Ku buntu ubuzima bwose
            </span>
          </h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            Uhindura ibiciro, ibihugu, amabanki, amatangazo n&apos;ibindi mu kuvuga gusa. Bihinduka ubu nyene,
            nta GitHub canke deploy. Ntabwo bisaba interineti nyinshi kandi ntawurihira.
          </p>
        </div>
      </div>

      {/* Chat window */}
      <div
        ref={scrollRef}
        className="flex h-[380px] flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                m.role === "user"
                  ? "rounded-br-sm bg-emerald-500 font-medium text-slate-950"
                  : "rounded-bl-sm border border-slate-800 bg-slate-900 text-slate-100"
              }`}
            >
              {m.role === "assistant" && m.changed ? (
                <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
                  <Sparkles className="h-3 w-3" /> Vyahinduwe
                </span>
              ) : null}
              {m.text}
              {m.role === "assistant" && m.revert ? (
                <button
                  onClick={() => undo(m.revert!, m.id)}
                  disabled={busy}
                  className="mt-2 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:border-emerald-500 disabled:opacity-50"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Subiza inyuma
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Ndiko ndakora...
            </div>
          </div>
        ) : null}
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={busy}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-emerald-500 hover:text-white disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Andika... nk'igiciro 6030"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          onClick={() => send(input)}
          disabled={busy || input.trim().length < 2}
          aria-label="Rungika"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}
