"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { rateSettings, siteContent } from "@/lib/db/schema"
import { createSession, destroySession, verifyPassword } from "@/lib/admin-auth"
import { DEFAULT_CONTENT, type SiteContent, type FeeTier, type Country } from "@/lib/content-types"

export type SaveState = { success?: boolean; error?: string }

export async function login(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const password = String(formData.get("password") ?? "")
  if (!verifyPassword(password)) {
    return { error: "Ijambo ry'ibanga si ryo." }
  }
  await createSession()
  revalidatePath("/admin")
  return { success: true }
}

export async function logout() {
  await destroySession()
  revalidatePath("/admin")
}

export async function saveRates(_prev: SaveState, formData: FormData): Promise<SaveState> {
  if (!verifyPassword(String(formData.get("password") ?? ""))) {
    return { error: "Ijambo ry'ibanga si ryo. Andika neza kugira ubike." }
  }
  try {
    const usdMobileRate = Number(formData.get("usdMobileRate"))
    const usdBankRate = Number(formData.get("usdBankRate"))
    const marginPercent = Number(formData.get("marginPercent"))
    if (![usdMobileRate, usdBankRate, marginPercent].every((n) => Number.isFinite(n) && n >= 0)) {
      return { error: "Injiza ibiciro vy'ukuri." }
    }
    const margin = Math.max(0, Math.min(1, 1 - marginPercent / 100))
    const values = {
      usdMobileRate: String(usdMobileRate),
      usdBankRate: String(usdBankRate),
      margin: String(margin),
      updatedAt: new Date(),
    }
    await db
      .insert(rateSettings)
      .values({ id: 1, aedRates: {}, ...values })
      .onConflictDoUpdate({ target: rateSettings.id, set: values })
    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { error: "Habaye ikibazo mu kubika." }
  }
}

export async function saveContent(_prev: SaveState, formData: FormData): Promise<SaveState> {
  if (!verifyPassword(String(formData.get("password") ?? ""))) {
    return { error: "Ijambo ry'ibanga si ryo. Andika neza kugira ubike." }
  }
  try {
    const raw = formData.get("payload")
    if (typeof raw !== "string") return { error: "Nta makuru yaboneka." }
    const parsed = JSON.parse(raw) as Partial<SiteContent>

    // Merge over defaults to keep the shape complete.
    const merged: SiteContent = {
      ...DEFAULT_CONTENT,
      ...parsed,
      fees: Array.isArray(parsed.fees) ? (parsed.fees as FeeTier[]) : DEFAULT_CONTENT.fees,
      countries: Array.isArray(parsed.countries) ? (parsed.countries as Country[]) : DEFAULT_CONTENT.countries,
      marquee: Array.isArray(parsed.marquee) ? parsed.marquee : DEFAULT_CONTENT.marquee,
      burundiMobile: Array.isArray(parsed.burundiMobile) ? parsed.burundiMobile : DEFAULT_CONTENT.burundiMobile,
      burundiBanks: Array.isArray(parsed.burundiBanks) ? parsed.burundiBanks : DEFAULT_CONTENT.burundiBanks,
    }

    await db
      .insert(siteContent)
      .values({ id: 1, data: merged, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteContent.id, set: { data: merged, updatedAt: new Date() } })
    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { error: "Habaye ikibazo mu kubika." }
  }
}
