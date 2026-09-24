"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { rateSettings, siteContent } from "@/lib/db/schema"
import { isAuthenticated } from "@/lib/admin-auth"
import { getRateSettings, type RateData } from "@/lib/rates"
import { getSiteContent } from "@/lib/content"
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/content-types"
import { interpret, applyAction, type Action } from "@/lib/ai-command"
import { sendPushToAllClients } from "@/lib/push"

export type AssistantResponse = {
  ok: boolean
  reply: string
  changed?: boolean
  revert?: Action | null
}

async function persist(newRates: RateData | undefined, newContent: SiteContent | undefined) {
  if (newRates) {
    const values = {
      aedRates: newRates.aedRates ?? {},
      usdMobileRate: String(newRates.usdMobileRate),
      usdBankRate: String(newRates.usdBankRate),
      margin: String(newRates.margin),
      updatedAt: new Date(),
    }
    await db
      .insert(rateSettings)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: rateSettings.id, set: values })
  }
  if (newContent) {
    const merged: SiteContent = { ...DEFAULT_CONTENT, ...newContent }
    await db
      .insert(siteContent)
      .values({ id: 1, data: merged, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteContent.id, set: { data: merged, updatedAt: new Date() } })
  }
  revalidatePath("/")
  revalidatePath("/admin")
}

export async function runAssistantCommand(command: string): Promise<AssistantResponse> {
  if (!(await isAuthenticated())) return { ok: false, reply: "Banza winjire nk'umuyobozi." }
  if (!command || command.trim().length < 2) return { ok: false, reply: "Andika ico ushaka ko gihinduka." }

  try {
    const [rates, content] = await Promise.all([getRateSettings(), getSiteContent()])
    const res = interpret(command, { rates, content })
    if (res.type === "reply") return { ok: true, reply: res.reply, changed: false }

    // Push notifications are a side effect (no DB write) handled here.
    if (res.action.kind === "notify") {
      const { sent } = await sendPushToAllClients({
        title: res.action.title,
        body: res.action.body,
        url: "/",
        tag: "admin-broadcast",
      })
      return {
        ok: true,
        reply: `Narungitse itangazo ku bantu ${sent} bafise notifications: "${res.action.body}".`,
        changed: false,
      }
    }

    const applied = applyAction(res.action, rates, content)
    if (!applied.rates && !applied.content) {
      return { ok: true, reply: applied.summary, changed: false }
    }
    await persist(applied.rates, applied.content)
    return { ok: true, reply: applied.summary, changed: true, revert: applied.revert }
  } catch (err) {
    console.log("[v0] assistant command failed:", (err as Error).message)
    return { ok: false, reply: "Habaye ikibazo mu guhindura. Gerageza kandi." }
  }
}

export async function runAssistantRevert(action: Action): Promise<AssistantResponse> {
  if (!(await isAuthenticated())) return { ok: false, reply: "Banza winjire nk'umuyobozi." }
  try {
    const [rates, content] = await Promise.all([getRateSettings(), getSiteContent()])
    const applied = applyAction(action, rates, content)
    if (!applied.rates && !applied.content) return { ok: true, reply: applied.summary, changed: false }
    await persist(applied.rates, applied.content)
    return { ok: true, reply: `Nasubije inyuma. ${applied.summary}`, changed: true, revert: applied.revert }
  } catch (err) {
    console.log("[v0] assistant revert failed:", (err as Error).message)
    return { ok: false, reply: "Habaye ikibazo mu gusubiza inyuma." }
  }
}
