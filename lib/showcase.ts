import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { showcaseSlides, type ShowcaseSlide } from "@/lib/db/schema"

export type Slide = {
  id: number
  imageUrl: string
  title: string
  caption: string
  sortOrder: number
  active: boolean
}

function toSlide(row: ShowcaseSlide): Slide {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    title: row.title ?? "",
    caption: row.caption ?? "",
    sortOrder: row.sortOrder,
    active: row.active,
  }
}

// Public: only active slides, in display order.
export async function listActiveSlides(): Promise<Slide[]> {
  try {
    const rows = await db
      .select()
      .from(showcaseSlides)
      .where(eq(showcaseSlides.active, true))
      .orderBy(asc(showcaseSlides.sortOrder), asc(showcaseSlides.id))
    return rows.map(toSlide)
  } catch (err) {
    console.log("[v0] listActiveSlides failed:", (err as Error).message)
    return []
  }
}

// Admin: every slide.
export async function listAllSlides(): Promise<Slide[]> {
  const rows = await db
    .select()
    .from(showcaseSlides)
    .orderBy(asc(showcaseSlides.sortOrder), asc(showcaseSlides.id))
  return rows.map(toSlide)
}

export async function createSlide(input: { imageUrl: string; title: string; caption: string }): Promise<Slide> {
  const rows = await db.select().from(showcaseSlides)
  const nextOrder = rows.length ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0
  const [row] = await db
    .insert(showcaseSlides)
    .values({
      imageUrl: input.imageUrl.slice(0, 800000),
      title: input.title.slice(0, 120),
      caption: input.caption.slice(0, 300),
      sortOrder: nextOrder,
      active: true,
    })
    .returning()
  return toSlide(row)
}

export async function updateSlide(
  id: number,
  input: Partial<{ imageUrl: string; title: string; caption: string; active: boolean; sortOrder: number }>,
): Promise<Slide | null> {
  const values: Record<string, unknown> = {}
  if (typeof input.imageUrl === "string") values.imageUrl = input.imageUrl.slice(0, 800000)
  if (typeof input.title === "string") values.title = input.title.slice(0, 120)
  if (typeof input.caption === "string") values.caption = input.caption.slice(0, 300)
  if (typeof input.active === "boolean") values.active = input.active
  if (typeof input.sortOrder === "number") values.sortOrder = input.sortOrder
  if (Object.keys(values).length === 0) return null
  const [row] = await db.update(showcaseSlides).set(values).where(eq(showcaseSlides.id, id)).returning()
  return row ? toSlide(row) : null
}

export async function deleteSlide(id: number): Promise<void> {
  await db.delete(showcaseSlides).where(eq(showcaseSlides.id, id))
}
