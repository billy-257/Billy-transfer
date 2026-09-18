import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { appPopup, type AppPopup } from "@/lib/db/schema"

export type PopupData = {
  title: string
  body: string
  imageUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  active: boolean
  // A version string that changes whenever the popup is edited, so the client
  // can show it once per version per device.
  version: string
}

const EMPTY: PopupData = {
  title: "",
  body: "",
  imageUrl: null,
  ctaLabel: null,
  ctaUrl: null,
  active: false,
  version: "0",
}

function toData(row: AppPopup): PopupData {
  return {
    title: row.title ?? "",
    body: row.body ?? "",
    imageUrl: row.imageUrl ?? null,
    ctaLabel: row.ctaLabel ?? null,
    ctaUrl: row.ctaUrl ?? null,
    active: row.active,
    version: String(row.updatedAt?.getTime?.() ?? 0),
  }
}

export async function getPopup(): Promise<PopupData> {
  try {
    const rows = await db.select().from(appPopup).where(eq(appPopup.id, 1)).limit(1)
    if (!rows.length) return EMPTY
    return toData(rows[0])
  } catch (err) {
    console.log("[v0] getPopup failed:", (err as Error).message)
    return EMPTY
  }
}

export async function savePopup(input: {
  title: string
  body: string
  imageUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  active: boolean
}): Promise<PopupData> {
  const values = {
    title: input.title.slice(0, 120) || null,
    body: input.body.slice(0, 1000),
    imageUrl: input.imageUrl ? input.imageUrl.slice(0, 500000) : null,
    ctaLabel: input.ctaLabel ? input.ctaLabel.slice(0, 40) : null,
    ctaUrl: input.ctaUrl ? input.ctaUrl.slice(0, 300) : null,
    active: input.active,
    updatedAt: new Date(),
  }
  const [row] = await db
    .insert(appPopup)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: appPopup.id, set: values })
    .returning()
  return toData(row)
}
