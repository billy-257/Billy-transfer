import "server-only"
import { db } from "@/lib/db"
import { siteContent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/content-types"

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const rows = await db.select().from(siteContent).where(eq(siteContent.id, 1)).limit(1)
    if (rows.length === 0) return DEFAULT_CONTENT
    // Merge saved data over defaults so new fields always have a value.
    return { ...DEFAULT_CONTENT, ...(rows[0].data ?? {}) }
  } catch (err) {
    console.log("[v0] getSiteContent failed, using defaults:", (err as Error).message)
    return DEFAULT_CONTENT
  }
}
