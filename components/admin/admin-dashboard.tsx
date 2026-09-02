"use client"

import { useState } from "react"
import { LogOut, DollarSign, LayoutList, Users, MessageSquare, Bell, Sparkles } from "lucide-react"
import { logout } from "@/app/admin/actions"
import { RateEditor } from "@/components/admin/rate-editor"
import { ContentEditor } from "@/components/admin/content-editor"
import { VisitorsRoom } from "@/components/admin/visitors-room"
import { InboxRoom } from "@/components/admin/inbox-room"
import { AiIdeasRoom } from "@/components/admin/ai-ideas-room"
import { enablePush } from "@/lib/push-client"
import type { SiteContent } from "@/lib/content-types"
import type { VisitStats } from "@/lib/admin-data"

type Tab = "rates" | "content" | "visitors" | "inbox" | "ai"

type Props = {
  usdMobileRate: number
  usdBankRate: number
  marginPercent: number
  content: SiteContent
  visitStats: VisitStats
}

export function AdminDashboard({ usdMobileRate, usdBankRate, marginPercent, content, visitStats }: Props) {
  const [tab, setTab] = useState<Tab>("inbox")
  const [pushMsg, setPushMsg] = useState("")

  const tabBtn = (id: Tab, active: boolean) =>
    `flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
      active ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
    }`

  async function turnOnPush() {
    setPushMsg("")
    const res = await enablePush("admin")
    setPushMsg(res.ok ? "Uzoronka integuza (notifications) ku bubwiriza bushasha!" : res.error || "Ntibishoboye.")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-lg font-bold text-white">Admin — RUNGIKA NA BILLY</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={turnOnPush}
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
          >
            <Bell className="h-3.5 w-3.5" /> Integuza
          </button>
          <form action={logout}>
            <button className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-slate-500">
              <LogOut className="h-3.5 w-3.5" /> Sohoka
            </button>
          </form>
        </div>
      </header>

      {pushMsg ? (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
          {pushMsg}
        </p>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1 sm:grid-cols-5">
        <button onClick={() => setTab("inbox")} className={tabBtn("inbox", tab === "inbox")}>
          <MessageSquare className="h-4 w-4" /> Ubutumwa
        </button>
        <button onClick={() => setTab("ai")} className={tabBtn("ai", tab === "ai")}>
          <Sparkles className="h-4 w-4" /> AI
        </button>
        <button onClick={() => setTab("rates")} className={tabBtn("rates", tab === "rates")}>
          <DollarSign className="h-4 w-4" /> Ibiciro
        </button>
        <button onClick={() => setTab("content")} className={tabBtn("content", tab === "content")}>
          <LayoutList className="h-4 w-4" /> Ibindi
        </button>
        <button onClick={() => setTab("visitors")} className={tabBtn("visitors", tab === "visitors")}>
          <Users className="h-4 w-4" /> Abaje
        </button>
      </div>

      {tab === "inbox" ? (
        <InboxRoom />
      ) : tab === "ai" ? (
        <AiIdeasRoom />
      ) : tab === "rates" ? (
        <RateEditor usdMobileRate={usdMobileRate} usdBankRate={usdBankRate} marginPercent={marginPercent} />
      ) : tab === "content" ? (
        <ContentEditor content={content} />
      ) : (
        <VisitorsRoom stats={visitStats} />
      )}
    </div>
  )
}
